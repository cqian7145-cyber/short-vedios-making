import {AssetPlanSchema, type AssetPlan} from '../assetStrategySchema';
import {resolveLibraryAsset} from './libraryResolver';

export async function applyLibraryAssetsToPlan(input: AssetPlan, root: string): Promise<AssetPlan> {
  const plan=structuredClone(input);const libraryByScene=new Map<string,Set<string>>();
  for(const scene of plan.scenePlans){for(let i=0;i<scene.recraftAssets.length;i++){const asset=scene.recraftAssets[i];if(asset.source!=='library'&&asset.semanticRisk!=='high'){
    const result=await resolveLibraryAsset(root,{query:asset.subject,reuseKey:asset.reuseKey,assetKind:asset.assetKind,profileVersion:plan.profileVersion,visualRole:asset.isolation==='scene-plate'?'scene-plate':'isolated-subject'});
    if(result.asset&&result.match){asset.source='library';asset.libraryAssetId=result.asset.id;asset.assetId=result.asset.id;asset.subject=result.asset.subject;asset.assetKind=result.asset.assetKind;const set=libraryByScene.get(scene.sceneId)??new Set<string>();set.add(asset.reuseKey);libraryByScene.set(scene.sceneId,set);if(result.reuseFrequencyWarning)plan.warnings.push(`Library reuse frequency warning: ${result.asset.canonicalName} appeared in at least 3 of the last 5 Episodes.`);}
  }}
    const sources=new Set(scene.recraftAssets.map((asset)=>asset.source));if(sources.has('library')&&!sources.has('new')&&!sources.has('registry')&&!sources.has('episode'))scene.strategy=scene.proceduralElements.length?'hybrid':'reuse';scene.requiresNewAsset=scene.recraftAssets.some((asset)=>asset.source==='new');
  }
  const libraryKeys=new Set(plan.scenePlans.flatMap((scene)=>scene.recraftAssets.filter((asset)=>asset.source==='library').map((asset)=>asset.reuseKey)));
  plan.uniqueRecraftAssets=plan.uniqueRecraftAssets.filter((asset)=>asset.source==='new'&&!libraryKeys.has(asset.reuseKey));
  const newKeys=new Set(plan.scenePlans.flatMap((scene)=>scene.recraftAssets.filter((asset)=>asset.source==='new').map((asset)=>asset.reuseKey)));
  const libraryGroups=new Map<string,{assetId:string;sceneIds:string[];source:'library'}>();
  for(const scene of plan.scenePlans)for(const asset of scene.recraftAssets)if(asset.source==='library'){const item=libraryGroups.get(asset.reuseKey)??{assetId:asset.libraryAssetId??asset.assetId,sceneIds:[],source:'library' as const};if(!item.sceneIds.includes(scene.sceneId))item.sceneIds.push(scene.sceneId);libraryGroups.set(asset.reuseKey,item);}
  plan.reuseGroups=[...plan.reuseGroups.filter((group)=>group.source==='registry'&&!libraryGroups.has(group.reuseKey)),...plan.reuseGroups.filter((group)=>group.source==='new'&&newKeys.has(group.reuseKey)),...[...libraryGroups].map(([reuseKey,group])=>({reuseKey,...group}))];
  plan.budget.uniqueNewAssetCount=newKeys.size;plan.budget.utilization=newKeys.size/plan.budget.hardMax;
  return AssetPlanSchema.parse(plan);
}
