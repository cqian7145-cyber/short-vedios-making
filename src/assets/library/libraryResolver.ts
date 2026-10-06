import {readLibraryIndex, validateLibraryAssetFile} from './libraryValidation';
import {scoreLibraryAsset, type ScoredLibraryAsset} from './libraryScoring';
import type {LibraryAsset} from './librarySchema';

export type AssetRequest = {query: string; reuseKey?: string; canonicalName?: string; assetKind: LibraryAsset['assetKind']; profileVersion?: string; visualRole?: LibraryAsset['visualRole']; backgroundMode?: LibraryAsset['backgroundMode']; tags?: string[]; episodeId?: string};
export type LibraryResolution = {status: 'exact-match'|'safe-match'|'no-match'; asset?: LibraryAsset; match?: ScoredLibraryAsset; candidates: ScoredLibraryAsset[]; warnings: string[]; reuseFrequencyWarning?: boolean; withinEpisodeReuse?: boolean; crossEpisodeReuse?: boolean};
const kindCompatible = (wanted: string, got: string) => wanted === got || (wanted === 'industrial-object' && got === 'machine') || (wanted === 'machine' && got === 'industrial-object');
export async function resolveLibraryAsset(root: string, request: AssetRequest): Promise<LibraryResolution> {
  const index = await readLibraryIndex(root); const warnings: string[] = []; const valid: LibraryAsset[] = [];
  for (const asset of index.assets) { const file = await validateLibraryAssetFile(root, asset); if (file.ok) valid.push(asset); else warnings.push(file.warning!); }
  const scored = valid.map((asset) => scoreLibraryAsset(asset, request)).filter((item): item is ScoredLibraryAsset => Boolean(item)).sort((a,b) => b.score-a.score || a.asset.id.localeCompare(b.asset.id));
  const eligible = scored.filter(({asset}) => asset.enabled && kindCompatible(request.assetKind, asset.assetKind));
  const safe = eligible.find(({automatic,score,asset}) => automatic && score >= 80 && (!request.profileVersion || asset.profileVersion === request.profileVersion) && (!request.visualRole || asset.visualRole === request.visualRole) && (!request.backgroundMode || asset.backgroundMode === request.backgroundMode || asset.backgroundMode === 'transparent' || request.backgroundMode === 'transparent' && asset.hasAlpha));
  const automatic = safe;
  const history = automatic?.asset.usage.filter((entry)=>entry.episodeId!==request.episodeId) ?? [];
  const recentEpisodes = [...new Set(history.map((entry)=>entry.episodeId))].slice(-5);
  const repeated = Boolean(automatic && recentEpisodes.length >= 3);
  return {status: automatic ? (automatic.reason === 'reuseKey' || automatic.reason === 'canonicalName' ? 'exact-match' : 'safe-match') : 'no-match', ...(automatic ? {asset:automatic.asset,match:automatic} : {}), candidates:scored,warnings, ...(automatic ? {reuseFrequencyWarning:repeated,withinEpisodeReuse:automatic.asset.usage.some((u)=>u.episodeId===request.episodeId),crossEpisodeReuse:history.length>0} : {})};
}

export async function recordLibraryUse(root: string, assetId: string, episodeId: string, sceneId: string, usedAt = new Date().toISOString()): Promise<void> {
  const {writeLibraryIndex,readLibraryIndex} = await import('./libraryValidation'); const index=await readLibraryIndex(root);const asset=index.assets.find((item)=>item.id===assetId);if(!asset||!asset.enabled)throw new Error(`Enabled library asset ${assetId} was not found.`);if(asset.usage.some((entry)=>entry.episodeId===episodeId&&entry.sceneId===sceneId))return;asset.usageCount+=1;asset.lastUsedAt=usedAt;asset.usage.push({episodeId,sceneId,usedAt});await writeLibraryIndex(root,index);
}
