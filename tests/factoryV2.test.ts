import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {acquireFactoryLock,initialV2State,invalidateFrom,staleFromFingerprint} from '../src/factory-v2/factoryV2Core';
import {recordFactoryV2Review} from '../src/factory-v2/reviewDecision';
import {redactFactoryV2Message} from '../src/factory-v2/factoryV2';
import {FACTORY_V2_STAGES,FactoryV2StateSchema} from '../src/factory-v2/factoryV2Schema';
import {evaluateReleaseGate,enforceFactoryV2RecraftLimit,type ReleaseGateInput} from '../src/factory-v2/releaseGate';

test('Factory V2 state initializes every stage and a bounded status set',()=>{
  const state=initialV2State({episodeId:'demo-episode',topic:'The test topic',durationSeconds:60,mode:'draft',now:new Date('2026-10-06T00:00:00.000Z')});
  assert.equal(state.schemaVersion,'factory-v2-state-v1');assert.equal(Object.keys(state.stages).length,14);assert.equal(FACTORY_V2_STAGES.length,14);assert.equal(FactoryV2StateSchema.parse(state).status,'pending');
});
test('input fingerprint invalidates the changed stage and downstream only',()=>{
  const state=initialV2State({episodeId:'demo-episode',topic:'Topic',durationSeconds:60,mode:'draft'});
  for(const stage of FACTORY_V2_STAGES)state.stages[stage]={status:'completed',fingerprint:stage};
  assert.equal(staleFromFingerprint(state,{'07 ASSET PLAN':'changed'}),'07 ASSET PLAN');invalidateFrom(state,'07 ASSET PLAN');
  assert.equal(state.stages['06 VISUAL PLAN'].status,'completed');assert.equal(state.stages['07 ASSET PLAN'].status,'pending');assert.equal(state.stages['14 DELIVERY PACKAGE'].status,'pending');
});
test('same episode lock prevents concurrent factory runs and releases cleanly',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'factory-v2-lock-'));try{const lock=path.join(root,'.factory-v2.lock');const release=await acquireFactoryLock(lock);await assert.rejects(acquireFactoryLock(lock),/already running/);await release();const second=await acquireFactoryLock(lock);await second();}finally{await rm(root,{recursive:true,force:true});}
});
test('stale dead-process lock can be recovered',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'factory-v2-stale-'));try{const lock=path.join(root,'.factory-v2.lock');await mkdir(root,{recursive:true});await writeFile(lock,JSON.stringify({pid:2147483647,createdAt:new Date().toISOString()}));const release=await acquireFactoryLock(lock);await release();}finally{await rm(root,{recursive:true,force:true});}
});

function generatedAsset(id:string){return{id,reuseKey:id,assetKind:'object',subject:`A ${id} object`,episodeId:'demo-episode',sceneIds:['scene-a'],provider:'recraft',profileVersion:'recraft-v1',promptVersion:'recraft-style-v1',prompt:`NO EMBEDDED TEXT. ${id}`,cacheKey:'a'.repeat(64),filePath:`assets/generated/demo-episode/${id}.png`,width:100,height:100,format:'png',hasAlpha:true,backgroundMode:'transparent',createdAt:'2026-10-06T00:00:00.000Z',semanticRisk:'low',status:'needs-human-review',warnings:[]};}
async function reviewFixture(){const root=await mkdtemp(path.join(os.tmpdir(),'factory-v2-review-'));const generated=path.join(root,'generated','demo-episode'),assets=path.join(root,'assets','generated','demo-episode');await mkdir(generated,{recursive:true});await mkdir(assets,{recursive:true});await writeFile(path.join(generated,'hybrid-render-input.json'),JSON.stringify({schemaVersion:'hybrid-render-input-v1',episodeId:'demo-episode',allowPendingAssets:true,reviewDecisions:[],scenes:[{sceneId:'scene-a',strategy:'hybrid',resolvedStrategy:'hybrid',layout:'center-stage',signatureMoment:false,visualIntent:{primaryArchetype:'object',spatialLayout:'centered',cameraIntent:'slow-push',visualSubject:'door',motionIdea:'reveals choices'},assetIds:['visible-pending'],fallbacks:[]}],stagedAssets:[]}));await writeFile(path.join(assets,'asset-manifest.json'),JSON.stringify({schemaVersion:'asset-generation-manifest-v1',episodeId:'demo-episode',assets:[generatedAsset('visible-pending'),generatedAsset('not-visible'),generatedAsset('already-rejected')]}));await writeFile(path.join(assets,'asset-review.json'),JSON.stringify({episodeId:'demo-episode',assets:[{assetId:'visible-pending',decision:'pending',notes:'',reviewedAt:'2026-10-06T00:00:00.000Z'},{assetId:'not-visible',decision:'pending',notes:'',reviewedAt:'2026-10-06T00:00:00.000Z'},{assetId:'already-rejected',decision:'rejected',notes:'No',reviewedAt:'2026-10-06T00:00:00.000Z'}]}));return{root,assets};}
test('review approval approves only visible pending assets and never revives rejected assets',async()=>{
  const {root,assets}=await reviewFixture();try{const decision=await recordFactoryV2Review(root,{episodeId:'demo-episode',decision:'approved',notes:'Reviewed final draft.'});const state=JSON.parse(await readFile(path.join(assets,'asset-review.json'),'utf8')) as {assets:{assetId:string;decision:string}[]};assert.equal(state.assets.find((a)=>a.assetId==='visible-pending')?.decision,'approved');assert.equal(state.assets.find((a)=>a.assetId==='not-visible')?.decision,'pending');assert.equal(state.assets.find((a)=>a.assetId==='already-rejected')?.decision,'rejected');assert.deepEqual(decision.assetDecisions.map((a)=>a.assetId),['visible-pending','not-visible','already-rejected']);}finally{await rm(root,{recursive:true,force:true});}
});
test('request-changes records the decision without approving pending assets',async()=>{
  const {root,assets}=await reviewFixture();try{const decision=await recordFactoryV2Review(root,{episodeId:'demo-episode',decision:'changes-requested',notes:'The scene needs revision.'});const state=JSON.parse(await readFile(path.join(assets,'asset-review.json'),'utf8')) as {assets:{assetId:string;decision:string}[]};assert.equal(decision.decision,'changes-requested');assert.equal(state.assets.find((a)=>a.assetId==='visible-pending')?.decision,'pending');}finally{await rm(root,{recursive:true,force:true});}
});

const passingGate:ReleaseGateInput={researchVerified:true,episodeValid:true,assetPlanValid:true,usedAssets:['approved','procedural'],qaStale:false,qaResult:'pass',humanApproved:true};
test('release gate permits verified episode, valid plans, approved/procedural assets, fresh QA and approval',()=>assert.equal(evaluateReleaseGate(passingGate).allowed,true));
test('release gate stops an unverified Fact Pack',()=>assert.match(evaluateReleaseGate({...passingGate,researchVerified:false}).reasons.join(' '),/publication-ready/));
test('release gate stops an invalid Episode',()=>assert.match(evaluateReleaseGate({...passingGate,episodeValid:false}).reasons.join(' '),/Episode validation/));
test('release gate stops an invalid AssetPlan',()=>assert.match(evaluateReleaseGate({...passingGate,assetPlanValid:false}).reasons.join(' '),/AssetPlan validation/));
test('release gate never accepts a used pending asset',()=>assert.match(evaluateReleaseGate({...passingGate,usedAssets:['pending']}).reasons.join(' '),/pending asset/));
test('release gate never accepts a used rejected asset',()=>assert.match(evaluateReleaseGate({...passingGate,usedAssets:['rejected']}).reasons.join(' '),/rejected asset/));
test('release gate blocks a missing production asset',()=>assert.match(evaluateReleaseGate({...passingGate,usedAssets:['missing']}).reasons.join(' '),/missing/));
test('release gate detects stale QA',()=>assert.match(evaluateReleaseGate({...passingGate,qaStale:true}).reasons.join(' '),/stale/));
test('QA pass still requires the first final human approval',()=>assert.match(evaluateReleaseGate({...passingGate,humanApproved:false}).reasons.join(' '),/human approval/));
test('QA warning needs human acknowledgement of its warning codes',()=>assert.match(evaluateReleaseGate({...passingGate,qaResult:'warning',qaWarningCodes:['matte-warning']}).reasons.join(' '),/matte-warning/));
test('QA warning proceeds when the reviewed warning code still matches',()=>assert.equal(evaluateReleaseGate({...passingGate,qaResult:'warning',qaWarningCodes:['matte-warning'],acknowledgedWarningCodes:['matte-warning']}).allowed,true));
test('new warning after approval invalidates acknowledgement',()=>assert.equal(evaluateReleaseGate({...passingGate,qaResult:'warning',qaWarningCodes:['matte-warning','new-warning'],acknowledgedWarningCodes:['matte-warning']}).allowed,false));
test('QA fail blocks release by default',()=>assert.match(evaluateReleaseGate({...passingGate,qaResult:'fail'}).reasons.join(' '),/QA failed/));
test('QA fail override requires a reason',()=>assert.equal(evaluateReleaseGate({...passingGate,qaResult:'fail',overrideQaFail:true}).allowed,false));
test('QA fail override requires human approval',()=>assert.equal(evaluateReleaseGate({...passingGate,qaResult:'fail',humanApproved:false,overrideQaFail:true,overrideReason:'Intentional motif'}).allowed,false));
test('QA fail override with approval and reason is explicitly recorded',()=>assert.match(evaluateReleaseGate({...passingGate,qaResult:'fail',overrideQaFail:true,overrideReason:'Intentional motif'}).warnings.join(' '),/Intentional motif/));
test('QA fail override with approval and reason opens the release gate',()=>assert.equal(evaluateReleaseGate({...passingGate,qaResult:'fail',overrideQaFail:true,overrideReason:'Intentional motif'}).allowed,true));
test('repeating an approval is idempotent and preserves one record per asset',async()=>{
  const {root,assets}=await reviewFixture();try{await recordFactoryV2Review(root,{episodeId:'demo-episode',decision:'approved',notes:'First review'});await recordFactoryV2Review(root,{episodeId:'demo-episode',decision:'approved',notes:'Repeat'});const state=JSON.parse(await readFile(path.join(assets,'asset-review.json'),'utf8')) as {assets:{assetId:string}[]};assert.equal(state.assets.length,3);assert.equal(new Set(state.assets.map((item)=>item.assetId)).size,3);}finally{await rm(root,{recursive:true,force:true});}
});
test('Factory V2 error messages redact provider tokens and authorization values',()=>{const safe=redactFactoryV2Message('request failed sk-abcdefghijklmnopqrstuv Bearer secret-value');assert.doesNotMatch(safe,/sk-abcdefghijklmnopqrstuv|secret-value/);assert.match(safe,/\[REDACTED\]/);});
test('factory review serialization excludes provider credentials and style identifiers',async()=>{
  const {root}=await reviewFixture();try{await recordFactoryV2Review(root,{episodeId:'demo-episode',decision:'approved'});const saved=await readFile(path.join(root,'generated','demo-episode','factory-v2-review.json'),'utf8');assert.doesNotMatch(saved,/RECRAFT_API_KEY|DEEPSEEK_API_KEY|TAVILY_API_KEY|Authorization|styleId|styleID/i);}finally{await rm(root,{recursive:true,force:true});}
});
test('visible-asset review fixture flows into an approved release gate without provider calls',async()=>{
  const {root,assets}=await reviewFixture();try{await recordFactoryV2Review(root,{episodeId:'demo-episode',decision:'approved',notes:'Reviewed this draft.'});const state=JSON.parse(await readFile(path.join(assets,'asset-review.json'),'utf8')) as {assets:{assetId:string;decision:'approved'|'rejected'|'pending'}[]};const visible=state.assets.find((asset)=>asset.assetId==='visible-pending')!;assert.equal(visible.decision,'approved');const gate=evaluateReleaseGate({...passingGate,usedAssets:[visible.decision,'procedural'],qaResult:'warning',qaWarningCodes:['matte-warning'],acknowledgedWarningCodes:['matte-warning']});assert.equal(gate.allowed,true);}finally{await rm(root,{recursive:true,force:true});}
});
test('Recraft hard ceiling rejects excess assets before the generation stage',()=>assert.throws(()=>enforceFactoryV2RecraftLimit(4,3),/before provider calls/));
test('Recraft limit allows a zero-generation cache/library path',()=>assert.doesNotThrow(()=>enforceFactoryV2RecraftLimit(0,3)));
