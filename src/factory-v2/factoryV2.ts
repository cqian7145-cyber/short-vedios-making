import {copyFile, mkdir, readFile, readdir, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {runFactory} from '../factory/factory';
import type {FactoryOptions} from '../factory/factoryTypes';
import {AssetPlanSchema} from '../assets/assetStrategySchema';
import {AssetGenerationManifestSchema,AssetGenerationReportSchema} from '../assets/generation/assetGenerationSchema';
import {generateAssets} from '../assets/generation/assetGenerator';
import {createAssetStrategyPlan} from '../assets/assetStrategyDirector';
import {loadAssetRegistry} from '../assets/assetRegistry';
import {applyLibraryAssetsToPlan} from '../assets/library/libraryPlanIntegration';
import {getRecraftConfigurationState} from '../recraft/config';
import {EpisodeSchema} from '../episode/schema';
import {validateEpisode} from '../episode/validateEpisode';
import {normalizeEpisode} from '../episode/normalizeEpisode';
import {FactPackSchema} from '../research/schemas';
import {ContentBriefSchema} from '../ai/contentBriefSchema';
import {validateVisualPlan} from '../visual/visualDirector';
import {HybridRenderInputSchema,HybridRenderReportSchema,AssetReviewStateSchema} from '../composition/hybridTypes';
import {VisualQaReportSchema} from '../visual-qa/qaSchema';
import {validateAssetPlan} from '../assets/assetPlanValidation';
import {FACTORY_V2_STAGES,FactoryV2ReportSchema,FactoryV2ReviewSchema,FactoryV2StateSchema,type FactoryV2Report,type FactoryV2StageName,type FactoryV2State} from './factoryV2Schema';
import {evaluateReleaseGate,enforceFactoryV2RecraftLimit,type UsedAssetDecision} from './releaseGate';
import {acquireFactoryLock,fingerprintFile,initialV2State,readJson,stableFingerprint,writeJsonAtomic,invalidateFrom,staleFromFingerprint} from './factoryV2Core';

export type FactoryV2Options={id:string;topic?:string;durationSeconds?:number;mode:'draft'|'release';resume?:boolean;existingArtifacts?:boolean;maxRecraftAssets?:number;allowHighRisk?:boolean;overrideQaFail?:boolean;overrideReason?:string};
export type FactoryV2Result={state:FactoryV2State;report:FactoryV2Report;status:'awaiting-human-review'|'changes-requested'|'completed'};
const exists=async(file:string)=>{try{await stat(file);return true;}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return false;throw e;}};
const htmlEscape=(value:string)=>value.replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const readOptional=async<T>(file:string,parse:(value:unknown)=>T):Promise<T|undefined>=>await exists(file)?readJson(file,parse):undefined;
export const redactFactoryV2Message=(error:unknown)=>String(error instanceof Error?error.message:error).replace(/(sk-[A-Za-z0-9_-]{12,}|Bearer\s+\S+|(?:DEEPSEEK|TAVILY|RECRAFT)_API_KEY\s*[:=]\s*\S+|RECRAFT_STYLE_ID\s*[:=]\s*\S+)/gi,'[REDACTED]').slice(0,1000);
const pathsFor=(root:string,id:string)=>({generated:path.join(root,'generated',id),episode:path.join(root,'episodes','generated',`${id}.json`),validatedEpisode:path.join(root,'generated',id,'episode.validated.json'),factPack:path.join(root,'research',id,'fact-pack.json'),visualPlan:path.join(root,'generated',id,'visual-plan.json'),assetPlan:path.join(root,'generated',id,'asset-plan.json'),manifest:path.join(root,'assets','generated',id,'asset-manifest.json'),review:path.join(root,'assets','generated',id,'asset-review.json'),hybridReport:path.join(root,'generated',id,'hybrid-render-report.json'),hybridInput:path.join(root,'generated',id,'hybrid-render-input.json'),qa:path.join(root,'generated',id,'visual-qa-report.json'),qaStill:path.join(root,'qa',id,'hybrid'),state:path.join(root,'runs',id,'factory-v2-state.json'),report:path.join(root,'runs',id,'factory-v2-report.json'),lock:path.join(root,'runs',id,'.factory-v2.lock'),draft:path.join(root,'output',`${id}-hybrid-draft.mp4`),release:path.join(root,'output',`${id}-final.mp4`),delivery:path.join(root,'deliveries',id),reviewBundle:path.join(root,'deliveries',id,'review')});
function commandArgs(args:string[]){return args.map((arg)=>arg.replace(/\\/g,'/'));}
async function invokeTsx(root:string,script:string,args:string[]){
  const {spawn}=await import('node:child_process');
  const cli=path.join(root,'node_modules','tsx','dist','cli.mjs');
  await new Promise<void>((resolve,reject)=>{
    const child=spawn(process.execPath,[cli,path.join(root,script),...commandArgs(args)],{cwd:root,stdio:'inherit',env:process.env});
    child.once('error',reject);
    child.once('exit',(code)=>{if(code===0)resolve();else reject(new Error(`${script} exited with code ${code??'unknown'}.`));});
  });
}
function completeStage(state:FactoryV2State,name:FactoryV2StageName,fingerprint:string,started:number,message?:string){state.stages[name]={status:'completed',fingerprint,startedAt:new Date(started).toISOString(),completedAt:new Date().toISOString(),durationMs:Date.now()-started,...(message?{message}:{})};}
function classifyFailure(message:string){if(/\b429\b|rate.?limit|timeout|temporar|network|fetch failed/i.test(message))return{errorCategory:'provider-transient',retryable:true};if(/ENOENT|EACCES|EPERM|file|directory/i.test(message))return{errorCategory:'filesystem',retryable:false};if(/validation|schema|invalid|publication-ready|release gate/i.test(message))return{errorCategory:'validation',retryable:false};return{errorCategory:'pipeline',retryable:false};}
function reportFrom(state:FactoryV2State,prior?:Partial<FactoryV2Report>):FactoryV2Report{return FactoryV2ReportSchema.parse({schemaVersion:'factory-v2-report-v1',episodeId:state.episodeId,topic:state.topic,durationSeconds:state.durationSeconds,status:state.status,mode:state.mode,stages:state.stages,providerCalls:{deepseek:prior?.providerCalls?.deepseek??0,tavily:prior?.providerCalls?.tavily??0,recraft:prior?.providerCalls?.recraft??0},cacheHits:prior?.cacheHits??0,libraryHits:prior?.libraryHits??0,proceduralFallbacks:prior?.proceduralFallbacks??0,warnings:prior?.warnings??[],humanGate:prior?.humanGate??'not-reached',outputPaths:prior?.outputPaths??{},updatedAt:new Date().toISOString()});}
async function persist(root:string,p:ReturnType<typeof pathsFor>,state:FactoryV2State,report:FactoryV2Report){state.updatedAt=new Date().toISOString();report.status=state.status;report.stages=state.stages;report.updatedAt=state.updatedAt;await Promise.all([writeJsonAtomic(p.state,state),writeJsonAtomic(p.report,report)]);}

export async function runFactoryV2(options:FactoryV2Options,root=process.cwd()):Promise<FactoryV2Result>{
  if(!/^[a-z0-9][a-z0-9-]{1,79}$/.test(options.id))throw new Error('--id must be a safe lowercase kebab-case identifier.');
  if(options.mode==='release'&&options.overrideQaFail&&!options.overrideReason?.trim())throw new Error('--override-qa-fail requires a non-empty --override-reason.');
  const p=pathsFor(path.resolve(root),options.id),unlock=await acquireFactoryLock(p.lock);let state:FactoryV2State;
  try{
    const priorState=await readOptional(p.state,(v)=>FactoryV2StateSchema.parse(v));
    const existingEpisode=await readOptional(p.validatedEpisode,(v)=>EpisodeSchema.parse(v))??await readOptional(p.episode,(v)=>EpisodeSchema.parse(v));
    const topic=options.topic??priorState?.topic??existingEpisode?.metadata?.topic??'';
    if(!topic&&!options.existingArtifacts)throw new Error('--topic is required unless --resume or --existing-artifacts supplies a checkpoint.');
    const targetDuration=options.durationSeconds??priorState?.durationSeconds??(existingEpisode?normalizeEpisode(existingEpisode).durationInFrames/existingEpisode.fps:undefined)??150;
    state=options.resume&&priorState?priorState:initialV2State({episodeId:options.id,topic,durationSeconds:targetDuration,mode:options.mode});
    if(options.resume&&priorState){
      const fingerprints:Partial<Record<FactoryV2StageName,string>>={};
      if(await exists(path.join(p.generated,'content-brief.json')))fingerprints['02 CONTENT BRIEF']=await fingerprintFile(path.join(p.generated,'content-brief.json'));
      if(await exists(p.factPack))fingerprints['04 FACT PACK']=await fingerprintFile(p.factPack);
      const episodeFile=await exists(p.validatedEpisode)?p.validatedEpisode:p.episode;
      const episodeFingerprint=await exists(episodeFile)?await fingerprintFile(episodeFile):undefined;
      const visualFingerprint=await exists(p.visualPlan)?await fingerprintFile(p.visualPlan):undefined;
      const assetFingerprint=await exists(p.assetPlan)?await fingerprintFile(p.assetPlan):undefined;
      if(episodeFingerprint)fingerprints['05 VERIFIED EPISODE']=episodeFingerprint;
      if(visualFingerprint)fingerprints['06 VISUAL PLAN']=visualFingerprint;
      if(assetFingerprint)fingerprints['07 ASSET PLAN']=assetFingerprint;
      if(await exists(path.join(p.generated,'asset-generation-report.json')))fingerprints['09 ASSET GENERATION']=await fingerprintFile(path.join(p.generated,'asset-generation-report.json'));
      const changed=staleFromFingerprint(state,fingerprints);
      if(changed){const downstream:Partial<Record<FactoryV2StageName,FactoryV2StageName>>={'05 VERIFIED EPISODE':'06 VISUAL PLAN','06 VISUAL PLAN':'07 ASSET PLAN','07 ASSET PLAN':'08 ASSET RESOLUTION','09 ASSET GENERATION':'10 DRAFT HYBRID RENDER'};const first=downstream[changed]??changed;invalidateFrom(state,first);state.lastError=`Input fingerprint changed at ${changed}; downstream checkpoints from ${first} invalidated.`;}
    }
    if(priorState&&options.mode!==priorState.mode){state=invalidateFrom(state,'10 DRAFT HYBRID RENDER');state.mode=options.mode;}
    state.topic=topic;state.durationSeconds=targetDuration;state.mode=options.mode;state.status='running';
    const priorReport=await readOptional(p.report,(v)=>FactoryV2ReportSchema.parse(v));let report=reportFrom(state,priorReport);
    if(options.resume&&priorState?.lastError){report.warnings=report.warnings.filter((warning)=>warning!==priorState.lastError&&!warning.startsWith('ENOENT: no such file or directory'));state.lastError=undefined;}
    const releaseStageStart=options.mode==='release'?'13 RELEASE RENDER':'10 DRAFT HYBRID RENDER';
    const unlockAndSave=async()=>persist(root,p,state,report);
    try{
      state.stages['01 PREFLIGHT']={status:'running',startedAt:new Date().toISOString()};await unlockAndSave();
      const required=['content-brief.json','visual-plan.json','asset-plan.json','asset-generation-report.json','hybrid-render-report.json','hybrid-render-input.json'];
      if(options.existingArtifacts){for(const file of required)if(!(await exists(path.join(p.generated,file))))throw new Error(`--existing-artifacts is missing generated/${options.id}/${file}.`);}
      const haveEpisode=await exists(p.validatedEpisode)||await exists(p.episode);const planned={deepseek:!options.existingArtifacts&&(!(await exists(p.factPack))||!haveEpisode||!(await exists(p.visualPlan))),tavily:!options.existingArtifacts&&!(await exists(p.factPack)),recraft:0};
      console.log('HYBRID FACTORY V2');console.log(`Planned provider calls: DeepSeek ${planned.deepseek?'yes':'no'} · Tavily ${planned.tavily?'yes':'no'} · Recraft estimated after library/cache resolution`);
      completeStage(state,'01 PREFLIGHT',stableFingerprint({id:options.id,topic,durationSeconds:targetDuration,mode:options.mode,existingArtifacts:options.existingArtifacts??false}),Date.now(),'configuration and artifact paths validated');await unlockAndSave();
      if(options.mode==='release'){
        const decision=await readOptional(path.join(p.generated,'factory-v2-review.json'),(v)=>FactoryV2ReviewSchema.parse(v));
        if(decision?.decision==='changes-requested'){state.status='changes-requested';report.humanGate='changes-requested';report.warnings.push('Release paused because the human review requested changes.');await persist(root,p,state,report);return{state,report,status:'changes-requested'};}
        if(decision?.decision!=='approved'){state.status='awaiting-human-review';report.humanGate='required';report.warnings.push('Release paused until a human approves the final draft.');await persist(root,p,state,report);return{state,report,status:'awaiting-human-review'};}
      }
      if(!options.existingArtifacts){
        const stageStarted=Date.now();state.stages['02 CONTENT BRIEF']={status:'running',startedAt:new Date(stageStarted).toISOString()};await unlockAndSave();
        const started=Date.now();const phase1=await runFactory({id:options.id,topic,durationSeconds:targetDuration,draft:true,skipRender:true,resume:options.resume||Boolean(priorState)} satisfies FactoryOptions);
        report.providerCalls.deepseek=Math.max(report.providerCalls.deepseek,phase1.report.llmCallCount);report.providerCalls.tavily=Math.max(report.providerCalls.tavily,phase1.report.researchQueryCount);report.warnings=[...new Set([...report.warnings,...phase1.report.warnings])];
        const briefCheckpoint=path.join(phase1.runDirectory,'01-content-brief.json');
        if(await exists(briefCheckpoint)){await mkdir(p.generated,{recursive:true});await copyFile(briefCheckpoint,path.join(p.generated,'content-brief.json'));}
        completeStage(state,'02 CONTENT BRIEF',await fingerprintFile(path.join(p.generated,'content-brief.json')),started,'Phase 1 checkpoint reused/generated');
        completeStage(state,'03 RESEARCH',stableFingerprint({topic,sourceCount:phase1.report.sourceCount}),started,phase1.report.researchProvider);
        completeStage(state,'04 FACT PACK',await fingerprintFile(p.factPack),started,phase1.report.publicationReady?'verified':'not publication-ready');
        completeStage(state,'05 VERIFIED EPISODE',await fingerprintFile(p.episode),started,'validated by Phase 1 Factory');
        completeStage(state,'06 VISUAL PLAN',await fingerprintFile(p.visualPlan),started,'Task007 VisualPlan reused/generated');await unlockAndSave();
      }else{
        const started=Date.now();
        for(const [stage,file] of [['02 CONTENT BRIEF',path.join(p.generated,'content-brief.json')],['03 RESEARCH',path.join(root,'research',options.id,'research-report.json')],['04 FACT PACK',p.factPack],['05 VERIFIED EPISODE',existingEpisode? (await exists(p.validatedEpisode)?p.validatedEpisode:p.episode):p.episode],['06 VISUAL PLAN',p.visualPlan]] as const){
          if(stage==='03 RESEARCH'&&!await exists(file)){completeStage(state,stage,'existing-task007-artifacts',started,'Fact Pack checkpoint used; no research repeated');continue;}
          if(await exists(file))completeStage(state,stage,await fingerprintFile(file),started,'existing Task007 checkpoint');
        }
      }
      const episode=validateEpisode(await readFileJson(await exists(p.validatedEpisode)?p.validatedEpisode:p.episode),`Factory V2 Episode ${options.id}`);
      ContentBriefSchema.parse(await readFileJson(path.join(p.generated,'content-brief.json')));
      const factPack=FactPackSchema.parse(await readFileJson(p.factPack));const visualPlan=validateVisualPlan(await readFileJson(p.visualPlan),episode);
      if(!factPack.publicationReady&&options.mode==='release')throw new Error('Release blocked: Fact Pack is not publication-ready.');
      const assetStarted=Date.now();state.stages['07 ASSET PLAN']={status:'running',startedAt:new Date(assetStarted).toISOString()};await unlockAndSave();let assetPlan=await readOptional(p.assetPlan,(v)=>AssetPlanSchema.parse(v));
      if(assetPlan&&!validateAssetPlan(assetPlan,episode).valid)assetPlan=undefined;
      if(!assetPlan){const registry=await loadAssetRegistry();const planned=await createAssetStrategyPlan({episode,visualPlan,factPack,registryAssets:registry.assets,styleStatus:getRecraftConfigurationState().styleConfigured?'locked':'missing'});assetPlan=await applyLibraryAssetsToPlan(planned.plan,root);}
      const assetValidation=validateAssetPlan(assetPlan,episode);if(!assetValidation.valid)throw new Error(`AssetPlan failed validation:\n${assetValidation.errors.map((item)=>`- ${item}`).join('\n')}`);
      await writeJsonAtomic(p.assetPlan,assetPlan);
      completeStage(state,'07 ASSET PLAN',await fingerprintFile(p.assetPlan),assetStarted,'Task002 plan validated');
      state.stages['08 ASSET RESOLUTION']={status:'running',startedAt:new Date().toISOString()};await unlockAndSave();const genDry=await generateAssets(assetPlan,{root,dryRun:true,allowHighRisk:options.allowHighRisk});
      report.libraryHits=assetPlan.uniqueRecraftAssets.filter((a)=>a.source==='library').length;report.cacheHits=genDry.cached;report.providerCalls.recraft=0;
      console.log(`New Recraft assets required: ${genDry.generate} (Factory V2 maximum ${options.maxRecraftAssets??3})`);
      enforceFactoryV2RecraftLimit(genDry.generate,options.maxRecraftAssets??3);
      completeStage(state,'08 ASSET RESOLUTION',stableFingerprint({assetPlan:await fingerprintFile(p.assetPlan),libraryHits:report.libraryHits,cacheHits:genDry.cached}),Date.now(),`${report.libraryHits} library hits, ${genDry.cached} cache hits, ${genDry.generate} new assets`);
      const genStarted=Date.now();state.stages['09 ASSET GENERATION']={status:'running',startedAt:new Date(genStarted).toISOString()};await unlockAndSave();
      const generated=await generateAssets(assetPlan,{root,allowHighRisk:options.allowHighRisk});
      if(generated.report){const validated=AssetGenerationReportSchema.parse(generated.report);report.providerCalls.recraft=Math.max(report.providerCalls.recraft,validated.recraftCallCount);report.warnings.push(...validated.warnings);}
      completeStage(state,'09 ASSET GENERATION',await fingerprintFile(path.join(p.generated,'asset-generation-report.json')),genStarted,`${report.providerCalls.recraft} Recraft calls`);await unlockAndSave();
      const reviewDecision=await readOptional(path.join(p.generated,'factory-v2-review.json'),(v)=>FactoryV2ReviewSchema.parse(v));
      if(options.mode==='release'){
        const manifest=AssetGenerationManifestSchema.parse(await readFileJson(p.manifest));
        const review=await readOptional(p.review,(v)=>AssetReviewStateSchema.parse(v));
        const reviewMap=new Map(review?.assets.map((item)=>[item.assetId,item.decision])??[]);
        const draftInput=await readOptional(p.hybridInput,(v)=>HybridRenderInputSchema.parse(v));
        const usedIds=new Set(draftInput?.scenes.flatMap((scene)=>scene.assetIds)??[]);
        const manifestById=new Map(manifest.assets.map((asset)=>[asset.id,asset]));
        const usedAssets:UsedAssetDecision[]=[...usedIds].map((id)=>{
          const item=manifestById.get(id);if(!item)return'missing';
          const decision=reviewMap.get(id)??(item.status==='library-approved'?'approved':'pending');
          return decision;
        });
        const preGate=evaluateReleaseGate({researchVerified:factPack.publicationReady,episodeValid:true,assetPlanValid:true,usedAssets,qaStale:false,qaResult:'pass',humanApproved:reviewDecision?.decision==='approved'});
        const hardStops=preGate.reasons.filter((reason)=>!reason.includes('human approval'));
        if(hardStops.length)throw new Error(`Release pre-render gate failed:\n${hardStops.map((reason)=>`- ${reason}`).join('\n')}`);
      }
      const renderStage=options.mode==='draft'?'10 DRAFT HYBRID RENDER':'13 RELEASE RENDER';
      const reportFile=options.mode==='draft'?p.hybridReport:path.join(p.generated,'hybrid-release-render-report.json');
      const outputFile=options.mode==='draft'?p.draft:p.release;
      let hybridReport=await readOptional(reportFile,(v)=>HybridRenderReportSchema.parse(v));
      const renderFp=stableFingerprint({rendererVersion:'factory-v2-hybrid-render-v1',episode:await fingerprintFile(await exists(p.validatedEpisode)?p.validatedEpisode:p.episode),visual:await fingerprintFile(p.visualPlan),assetPlan:await fingerprintFile(p.assetPlan),manifest:await fingerprintFile(p.manifest),review:await fingerprintFile(p.review).catch(()=>''),mode:options.mode});
      const renderStarted=Date.now();
      if(!(options.resume&&state.stages[renderStage]?.status==='completed'&&state.stages[renderStage]?.fingerprint===renderFp&&await exists(outputFile))){
        state.stages[renderStage]={status:'running',startedAt:new Date(renderStarted).toISOString()};await unlockAndSave();
        await invokeTsx(root,'scripts/render-hybrid.ts',['--episode',path.relative(root,await exists(p.validatedEpisode)?p.validatedEpisode:p.episode),'--visual-plan',path.relative(root,p.visualPlan),'--asset-plan',path.relative(root,p.assetPlan),'--manifest',path.relative(root,p.manifest),'--output',path.relative(root,outputFile),'--report',path.relative(root,reportFile),...(options.mode==='draft'?['--allow-pending-assets']:[])]);
        hybridReport=HybridRenderReportSchema.parse(await readFileJson(reportFile));
      }
      if(!hybridReport)hybridReport=HybridRenderReportSchema.parse(await readFileJson(reportFile));
      report.proceduralFallbacks=hybridReport.fallbackCount;
      if(options.mode==='release'&&hybridReport.pendingAssetCount>0)throw new Error('Release render is unsafe: pending assets remain in the used render input.');
      completeStage(state,renderStage,renderFp,renderStarted,options.mode==='draft'?(hybridReport.pendingAssetCount?'DRAFT — UNREVIEWED ASSETS':'DRAFT — NOT RELEASE APPROVED'):'safe release render');
      if(options.mode==='draft'){
        const qaStarted=Date.now();state.stages['11 VISUAL QA']={status:'running',startedAt:new Date(qaStarted).toISOString()};await unlockAndSave();await invokeTsx(root,'scripts/visual-qa.ts',['--episode',path.relative(root,await exists(p.validatedEpisode)?p.validatedEpisode:p.episode),'--visual-plan',path.relative(root,p.visualPlan),'--asset-plan',path.relative(root,p.assetPlan),'--hybrid-report',path.relative(root,p.hybridReport),'--stills',path.relative(root,p.qaStill)]);
        const qa=VisualQaReportSchema.parse(await readFileJson(p.qa));completeStage(state,'11 VISUAL QA',stableFingerprint({render:await fingerprintFile(p.hybridReport),stills:await hashDirectory(p.qaStill)}),qaStarted,`${qa.scores.total}/100 ${qa.status}; ${qa.gate.releaseModeAction}`);
        report.humanGate='required';state.status='awaiting-human-review';report.outputPaths={draft:path.relative(root,p.draft),review:path.relative(root,p.reviewBundle),qa:path.relative(root,p.qa)};
        state.stages['12 HUMAN REVIEW GATE']={status:'running',startedAt:new Date().toISOString()};await unlockAndSave();completeStage(state,'12 HUMAN REVIEW GATE',stableFingerprint({draft:renderFp,qa:qa.inputFingerprints}),Date.now(),'review bundle prepared; awaiting human review');
        await createReviewBundle(root,p,episode,hybridReport,qa,assetPlan);
        for(const stage of ['13 RELEASE RENDER','14 DELIVERY PACKAGE'] as const)state.stages[stage]={status:'pending'};
        report.warnings=[...new Set([...report.warnings,...qa.warnings.map((w)=>`${htmlEscape(w.severity)}: ${htmlEscape(w.message)}`)])];await persist(root,p,state,report);
        console.log('Status: AWAITING HUMAN REVIEW');console.log(`Review bundle: ${path.relative(root,p.reviewBundle)}`);console.log(`Resume after approval: npm run factory:v2 -- --id ${options.id} --resume --release`);
        return{state,report,status:'awaiting-human-review'};
      }
      const qaStarted=Date.now();state.stages['11 VISUAL QA']={status:'running',startedAt:new Date(qaStarted).toISOString()};await unlockAndSave();await invokeTsx(root,'scripts/visual-qa.ts',['--episode',path.relative(root,await exists(p.validatedEpisode)?p.validatedEpisode:p.episode),'--visual-plan',path.relative(root,p.visualPlan),'--asset-plan',path.relative(root,p.assetPlan),'--hybrid-report',path.relative(root,reportFile),'--stills',path.relative(root,p.qaStill)]);
      const finalQa=VisualQaReportSchema.parse(await readFileJson(p.qa));completeStage(state,'11 VISUAL QA',stableFingerprint({releaseRender:await fingerprintFile(reportFile),stills:await hashDirectory(p.qaStill)}),qaStarted,`release QA rerun: ${finalQa.scores.total}/100 ${finalQa.status}`);
      const finalInput=HybridRenderInputSchema.parse(await readFileJson(p.hybridInput));
      const finalManifest=AssetGenerationManifestSchema.parse(await readFileJson(p.manifest));
      const assetDecisions=new Map(reviewDecision?.assetDecisions.map((item)=>[item.assetId,item.decision])??[]);
      const finalUsedAssets:UsedAssetDecision[]=finalInput.scenes.flatMap((scene)=>scene.assetIds).map((id)=>assetDecisions.get(id)??(finalManifest.assets.find((asset)=>asset.id===id)?.status==='library-approved'?'approved':'missing'));
      const warningCodes=finalQa.warnings.filter((warning)=>warning.severity==='warning'||warning.severity==='critical').map((warning)=>warning.code);
      const gate=evaluateReleaseGate({researchVerified:factPack.publicationReady,episodeValid:true,assetPlanValid:true,usedAssets:finalUsedAssets,qaStale:finalQa.stale,qaResult:finalQa.gate.result,humanApproved:reviewDecision?.decision==='approved',qaWarningCodes:warningCodes,acknowledgedWarningCodes:reviewDecision?.acknowledgedWarningCodes,overrideQaFail:options.overrideQaFail,overrideReason:options.overrideReason});
      if(!gate.allowed)throw new Error(`Release gate failed:\n${gate.reasons.map((reason)=>`- ${reason}`).join('\n')}`);
      state.status='release-ready';completeStage(state,'12 HUMAN REVIEW GATE',stableFingerprint(reviewDecision),Date.now(),'human approval recorded; warning acknowledged when present');
      const manifestOut={episodeId:episode.id,topic:state.topic,duration:state.durationSeconds,resolution:'1920x1080',fps:30,renderMode:'hybrid-release',researchVerified:factPack.publicationReady,assetReviewStatus:'approved-or-procedural',visualQaStatus:finalQa.status,visualQaScore:finalQa.scores.total,humanReviewed:true,...(options.overrideQaFail?{qaOverride:{reason:options.overrideReason}}:{}),sourceCount:factPack.sources.length,recraftGenerationCount:report.providerCalls.recraft,libraryReuseCount:report.libraryHits,cacheHitCount:report.cacheHits,proceduralFallbackCount:report.proceduralFallbacks,musicRequired:true,hashes:{episode:await fingerprintFile(await exists(p.validatedEpisode)?p.validatedEpisode:p.episode),factPack:await fingerprintFile(p.factPack),visualPlan:await fingerprintFile(p.visualPlan),assetPlan:await fingerprintFile(p.assetPlan),assetManifest:await fingerprintFile(p.manifest),releaseRenderInput:await fingerprintFile(p.hybridInput),visualQa:await fingerprintFile(p.qa),finalMp4:await fingerprintFile(p.release)},createdAt:new Date().toISOString()};
      state.stages['14 DELIVERY PACKAGE']={status:'running',startedAt:new Date().toISOString()};await unlockAndSave();await mkdir(p.delivery,{recursive:true});await copyFile(p.release,path.join(p.delivery,'final.mp4'));await copyFile(await exists(p.validatedEpisode)?p.validatedEpisode:p.episode,path.join(p.delivery,'episode.json'));await copyFile(p.visualPlan,path.join(p.delivery,'visual-plan.json'));await copyFile(p.assetPlan,path.join(p.delivery,'asset-plan.json'));await copyFile(p.manifest,path.join(p.delivery,'asset-manifest.json'));await copyFile(p.qa,path.join(p.delivery,'visual-qa-report.json'));await copyFile(path.join(root,'research',options.id,'sources.md'),path.join(p.delivery,'sources.md')).catch(()=>undefined);
      await writeJsonAtomic(path.join(p.delivery,'delivery-manifest.json'),manifestOut);await writeFile(path.join(p.delivery,'README.txt'),`Hybrid Factory V2 delivery\nEpisode: ${episode.id}\nMusic required: yes (user supplied)\nYouTube upload: manual\n`, 'utf8');
      completeStage(state,'14 DELIVERY PACKAGE',stableFingerprint(manifestOut),Date.now(),'final MP4 and hashed manifest packaged');state.status='completed';report.humanGate='approved';report.outputPaths={final:path.relative(root,path.join(p.delivery,'final.mp4')),qa:path.relative(root,p.qa),delivery:path.relative(root,p.delivery)};await persist(root,p,state,report);return{state,report,status:'completed'};
    }catch(error){state.status='failed';state.lastError=redactFactoryV2Message(error);const active=FACTORY_V2_STAGES.find((s)=>state.stages[s].status==='running');if(active)state.stages[active]={...state.stages[active],status:'failed',message:state.lastError,...classifyFailure(state.lastError)};report.warnings.push(state.lastError);await persist(root,p,state,report);throw error;}
  }finally{await unlock();}
}
async function readFileJson(file:string):Promise<unknown>{return JSON.parse(await readFile(file,'utf8')) as unknown;}
async function hashDirectory(dir:string):Promise<Record<string,string>>{const {createHash}=await import('node:crypto');const out:Record<string,string>={};for(const name of (await readdir(dir)).filter((n)=>n.toLowerCase().endsWith('.png')).sort()){out[name]=createHash('sha256').update(await readFile(path.join(dir,name))).digest('hex');}return out;}
async function createReviewBundle(root:string,p:ReturnType<typeof pathsFor>,episode:ReturnType<typeof EpisodeSchema.parse>,hybrid:ReturnType<typeof HybridRenderReportSchema.parse>,qa:ReturnType<typeof VisualQaReportSchema.parse>,assetPlan:ReturnType<typeof AssetPlanSchema.parse>){
  await mkdir(path.join(p.reviewBundle,'representative-stills'),{recursive:true});await copyFile(p.draft,path.join(p.reviewBundle,'draft.mp4'));
  for(const name of await readdir(p.qaStill)){if(name.toLowerCase().endsWith('.png'))await copyFile(path.join(p.qaStill,name),path.join(p.reviewBundle,'representative-stills',name));}
  for(const name of ['visual-qa-report.json','visual-qa.html','VISUAL_REVIEW.md']){const from=name==='visual-qa-report.json'?p.qa:path.join(root,'qa',episode.id,name);if(await exists(from))await copyFile(from,path.join(p.reviewBundle,name));}
  for(const name of ['preview.html']){const from=path.join(root,'assets','generated',episode.id,name);if(await exists(from))await copyFile(from,path.join(p.reviewBundle,'asset-preview.html'));}
  const status=(await readOptional(p.review,(v)=>AssetReviewStateSchema.parse(v)))??AssetReviewStateSchema.parse({episodeId:episode.id,assets:[]});
  const summary={approved:status.assets.filter((a)=>a.decision==='approved').length,pending:status.assets.filter((a)=>a.decision==='pending').length,rejected:status.assets.filter((a)=>a.decision==='rejected').length,fallbacks:hybrid.fallbackCount,assetPlanCount:assetPlan.uniqueRecraftAssets.length};
  const draftStatus=hybrid.pendingAssetCount>0?'DRAFT — UNREVIEWED ASSETS':'DRAFT — NOT RELEASE APPROVED';
  await writeFile(path.join(p.reviewBundle,'review.html'),`<!doctype html><meta charset="utf-8"><title>Factory V2 review · ${htmlEscape(episode.id)}</title><style>body{background:#080b10;color:#e8e3d7;font:16px system-ui;max-width:1100px;margin:40px auto;padding:20px}a{color:#d0ad6d}video{width:100%}li{margin:8px}</style><h1>${htmlEscape(episode.title)}</h1><p>${htmlEscape(episode.id)} · ${qa.withinEpisode.durationSeconds}s · ${draftStatus}</p><video controls src="draft.mp4"></video><h2>Assets</h2><p>Approved ${summary.approved} · Pending ${summary.pending} · Rejected ${summary.rejected} · Fallbacks ${summary.fallbacks}</p><h2>Visual QA</h2><p>${qa.scores.total}/100 · ${qa.status} · gate ${qa.gate.result}</p><ul>${qa.warnings.map((w)=>`<li>${htmlEscape(w.severity)}: ${htmlEscape(w.message)}</li>`).join('')}</ul><h2>Sources</h2><p>See included sources.md for the verified source summary.</p><p><a href="visual-qa.html">Open QA report</a></p>`,'utf8');
  const src=path.join(root,'research',episode.id,'sources.md');if(await exists(src))await copyFile(src,path.join(p.reviewBundle,'sources.md'));
}
