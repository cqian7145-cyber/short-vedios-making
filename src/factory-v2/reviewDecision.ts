import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {AssetGenerationManifestSchema} from '../assets/generation/assetGenerationSchema';
import {AssetReviewStateSchema} from '../composition/hybridTypes';
import {HybridRenderInputSchema} from '../composition/hybridTypes';
import {VisualQaReportSchema} from '../visual-qa/qaSchema';
import {FactoryV2ReviewSchema,type FactoryV2Review} from './factoryV2Schema';
import {acquireFactoryLock,writeJsonAtomic} from './factoryV2Core';

async function recordReviewUnlocked(root:string,input:{episodeId:string;decision:'approved'|'changes-requested';notes?:string;now?:Date}):Promise<FactoryV2Review>{
  const generated=path.join(root,'generated',input.episodeId),assetDir=path.join(root,'assets','generated',input.episodeId);
  const snapshot=HybridRenderInputSchema.parse(JSON.parse(await readFile(path.join(generated,'hybrid-render-input.json'),'utf8')) as unknown);
  const manifest=AssetGenerationManifestSchema.parse(JSON.parse(await readFile(path.join(assetDir,'asset-manifest.json'),'utf8')) as unknown);
  const reviewPath=path.join(assetDir,'asset-review.json');
  let review=AssetReviewStateSchema.parse({episodeId:input.episodeId,assets:[]});
  try { review=AssetReviewStateSchema.parse(JSON.parse(await readFile(reviewPath,'utf8')) as unknown); } catch(error) { if((error as NodeJS.ErrnoException).code!=='ENOENT') throw error; }
  const visible=new Set(snapshot.scenes.flatMap((scene)=>scene.assetIds));
  const current=new Map(review.assets.map((item)=>[item.assetId,item]));
  const decisions:FactoryV2Review['assetDecisions']=[];
  if(input.decision==='approved') for(const item of manifest.assets) {
    const prior=current.get(item.id);
    const decision=prior?.decision??'pending';
    if(decision==='rejected') { decisions.push({assetId:item.id,decision:'rejected'}); continue; }
    if(decision==='pending'&&visible.has(item.id)) {
      const approved={assetId:item.id,decision:'approved' as const,notes:input.notes??'Approved in the final Factory V2 draft review.',reviewedAt:(input.now??new Date()).toISOString()};
      current.set(item.id,approved); decisions.push({assetId:item.id,decision:'approved'});
    } else decisions.push({assetId:item.id,decision});
  }
  const next=AssetReviewStateSchema.parse({episodeId:input.episodeId,assets:[...current.values()].sort((a,b)=>a.assetId.localeCompare(b.assetId))});
  await writeJsonAtomic(reviewPath,next);
  let reviewedQaFingerprint:string|undefined;let acknowledgedWarningCodes:string[]|undefined;
  try { const qa=VisualQaReportSchema.parse(JSON.parse(await readFile(path.join(generated,'visual-qa-report.json'),'utf8')) as unknown);reviewedQaFingerprint=JSON.stringify(qa.inputFingerprints);acknowledgedWarningCodes=qa.warnings.filter((warning)=>warning.severity==='warning'||warning.severity==='critical').map((warning)=>warning.code).sort(); } catch(error) { if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error; }
  const result=FactoryV2ReviewSchema.parse({episodeId:input.episodeId,decision:input.decision,notes:input.notes??'',reviewedAt:(input.now??new Date()).toISOString(),assetDecisions:decisions,...(reviewedQaFingerprint?{reviewedQaFingerprint}:{}),...(acknowledgedWarningCodes?{acknowledgedWarningCodes}:{})});
  await writeJsonAtomic(path.join(generated,'factory-v2-review.json'),result);
  return result;
}
export async function recordFactoryV2Review(root:string,input:{episodeId:string;decision:'approved'|'changes-requested';notes?:string;now?:Date}):Promise<FactoryV2Review>{
  const unlock=await acquireFactoryLock(path.join(root,'runs',input.episodeId,'.factory-v2.lock'));
  try{return await recordReviewUnlocked(root,input);}finally{await unlock();}
}
