import {access,copyFile,mkdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {AssetPlanSchema,type AssetPlan} from './assetStrategySchema';
import {AssetGenerationManifestSchema} from './generation/assetGenerationSchema';
import {inspectPng} from './generation/assetValidator';
import {EpisodeSchema,type Episode} from '../episode/schema';
import {VisualPlanSchema,type VisualPlan} from '../visual/schemas';

export const HybridSceneAssetSchema=z.strictObject({assetId:z.string(),assetKind:z.string(),publicPath:z.string(),position:z.enum(['left','right','center']),semanticRisk:z.enum(['low','medium','high']),warnings:z.array(z.string())});
export const HybridCompositionReportSchema=z.strictObject({episodeId:z.string(),visualPlanSceneCount:z.number().int().nonnegative(),assetPlanSceneCount:z.number().int().nonnegative(),boundAssetCount:z.number().int().nonnegative(),skippedAssetCount:z.number().int().nonnegative(),status:z.enum(['pass','warning','fail']),warnings:z.array(z.string()),assets:z.array(z.strictObject({sceneId:z.string(),assetId:z.string(),status:z.enum(['bound','skipped','missing']),reason:z.string().optional()}))});
export type HybridSceneAsset=z.infer<typeof HybridSceneAssetSchema>;
export type HybridCompositionReport=z.infer<typeof HybridCompositionReportSchema>;
export type HybridCompositionInputs={episode:unknown;visualPlan:unknown;assetPlan:unknown;assetManifest:unknown};

function safeId(value:string){if(!/^[a-z0-9][a-z0-9-]{1,79}$/.test(value))throw new Error('Episode or asset id contains unsafe path characters.');return value;}
function textRisk(warnings:string[]){return warnings.find((warning)=>/(embedded\s+(?:text|numeral|number)|(?:visible|prominent)\s+.*(?:text|numeral|number)|unwanted\s+(?:text|number))/i.test(warning));}
function positionFor(layout:VisualPlan['scenePlans'][number]['layoutVariant']):HybridSceneAsset['position'] {if(layout==='left-focus')return'right';if(layout==='right-focus')return'left';if(layout==='full-field')return'center';return'right';}
function validateMapping(episode:Episode,visualPlan:VisualPlan,assetPlan:AssetPlan){if(assetPlan.episodeId!==episode.id)throw new Error('AssetPlan episodeId does not match Episode.');const ids=episode.scenes.map((scene)=>scene.id);for(const [label,scenes] of [['VisualPlan',visualPlan.scenePlans],['AssetPlan',assetPlan.scenePlans]] as const){if(scenes.length!==ids.length||scenes.some((scene,index)=>scene.sceneId!==ids[index]))throw new Error(`${label} scene IDs must match Episode in order.`);}}

export async function prepareHybridComposition(input:HybridCompositionInputs,options:{root?:string;publicDirectory?:string;copyAssets?:boolean}={}):Promise<{report:HybridCompositionReport;sceneAssets:Record<string,HybridSceneAsset[]>;episode:Episode;visualPlan:VisualPlan;assetPlan:AssetPlan}>{
  const root=path.resolve(options.root??process.cwd());const episode=EpisodeSchema.parse(input.episode);const visualPlan=VisualPlanSchema.parse(input.visualPlan);const assetPlan=AssetPlanSchema.parse(input.assetPlan);const manifest=AssetGenerationManifestSchema.parse(input.assetManifest);validateMapping(episode,visualPlan,assetPlan);if(manifest.episodeId!==episode.id)throw new Error('Recraft asset manifest episodeId does not match Episode.');safeId(episode.id);
  const byReuseKey=new Map(manifest.assets.map((asset)=>[asset.reuseKey,asset]));const layoutByScene=new Map(visualPlan.scenePlans.map((scene)=>[scene.sceneId,scene.layoutVariant]));const sceneAssets:Record<string,HybridSceneAsset[]>={};const assets:HybridCompositionReport['assets']=[];const warnings:string[]=[];let bound=0;let skipped=0;
  const publicDirectory=path.resolve(options.publicDirectory??path.join(root,'public','generated-hybrid-assets',episode.id));
  for(const scene of assetPlan.scenePlans){if(!['hybrid','recraft','reuse'].includes(scene.strategy))continue;for(const planned of scene.recraftAssets){const generated=byReuseKey.get(planned.reuseKey);if(!generated){skipped++;const reason=`No generated asset found for reuse key ${planned.reuseKey}.`;warnings.push(`${scene.sceneId}: ${reason}`);assets.push({sceneId:scene.sceneId,assetId:planned.assetId,status:'missing',reason});continue;}
      const explicitRisk=textRisk(generated.warnings);if(explicitRisk){skipped++;const reason=`Asset blocked by embedded-text warning: ${explicitRisk}`;warnings.push(`${scene.sceneId}/${planned.assetId}: ${reason}`);assets.push({sceneId:scene.sceneId,assetId:planned.assetId,status:'skipped',reason});continue;}
      if(generated.semanticRisk==='high'){skipped++;const reason='High-risk asset is not eligible for automatic composition.';warnings.push(`${scene.sceneId}/${planned.assetId}: ${reason}`);assets.push({sceneId:scene.sceneId,assetId:planned.assetId,status:'skipped',reason});continue;}
      const source=path.resolve(root,generated.filePath);const rel=path.relative(root,source);if(rel.startsWith('..')||path.isAbsolute(rel))throw new Error(`Generated asset path escapes workspace: ${planned.assetId}.`);const png=await readFile(source);inspectPng(png);await access(source);
      const filename=`${safeId(planned.assetId)}.png`;if(options.copyAssets!==false){await mkdir(publicDirectory,{recursive:true});await copyFile(source,path.join(publicDirectory,filename));}
      const publicPath=`generated-hybrid-assets/${episode.id}/${filename}`;const binding=HybridSceneAssetSchema.parse({assetId:planned.assetId,assetKind:planned.assetKind,publicPath,position:positionFor(layoutByScene.get(scene.sceneId)??'center-stage'),semanticRisk:generated.semanticRisk,warnings:generated.warnings});(sceneAssets[scene.sceneId]??=[]).push(binding);bound++;assets.push({sceneId:scene.sceneId,assetId:planned.assetId,status:'bound'});
      if(generated.status==='needs-human-review')warnings.push(`${scene.sceneId}/${planned.assetId}: generated asset remains pending semantic and embedded-text human review.`);
    }}
  if(bound===0)warnings.push('No Recraft subjects are available for the hybrid render.');
  const report=HybridCompositionReportSchema.parse({episodeId:episode.id,visualPlanSceneCount:visualPlan.scenePlans.length,assetPlanSceneCount:assetPlan.scenePlans.length,boundAssetCount:bound,skippedAssetCount:skipped,status:skipped||warnings.length?'warning':'pass',warnings:[...new Set(warnings)],assets});
  return{report,sceneAssets,episode,visualPlan,assetPlan};
}
