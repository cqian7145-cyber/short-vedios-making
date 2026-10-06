import {access, readFile} from 'node:fs/promises';
import path from 'node:path';
import {AssetGenerationManifestSchema, type GeneratedAsset} from './assetGenerationSchema';
import {readLibraryIndex, validateLibraryAssetFile} from '../library/libraryValidation';

export async function findReusableAsset(root: string, reuseKey: string, episodeId = 'library-reuse', libraryAssetId?: string): Promise<GeneratedAsset | undefined> {
  const index=await readLibraryIndex(root);
  for(const asset of index.assets){
    if(!asset.enabled||asset.reviewStatus!=='approved'||!(asset.id===libraryAssetId||asset.reuseKey===reuseKey||asset.aliases.includes(reuseKey)))continue;
    const validation=await validateLibraryAssetFile(root,asset);if(!validation.ok)continue;
    return{id:asset.id,reuseKey,assetKind:asset.assetKind,subject:asset.subject,episodeId,sceneIds:[],provider:asset.provider,profileVersion:'recraft-v1',promptVersion:asset.provider==='curated'?'curated-intake-v1':'recraft-style-v1',prompt:'Approved local Asset Library reuse.',cacheKey:asset.contentHash,filePath:asset.filePath,width:asset.width,height:asset.height,format:asset.format,hasAlpha:asset.hasAlpha,backgroundMode:asset.backgroundMode,createdAt:asset.createdAt,semanticRisk:'low',status:'library-approved',warnings:[],libraryAssetId:asset.id};
  }
  for (const base of [path.join(root,'assets','generated'), path.join(root,'assets','library')]) {
    let dirs: string[]; try { dirs = await (await import('node:fs/promises')).readdir(base); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') continue; throw new Error('Could not scan generated asset registries.'); }
    for (const dir of dirs) {
      const file = path.join(base,dir,'asset-manifest.json'); let value: unknown;
      try { value = JSON.parse(await readFile(file,'utf8')); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') continue; throw new Error(`Asset manifest is unreadable: ${path.relative(root,file)}.`); }
      const parsed = AssetGenerationManifestSchema.safeParse(value); if (!parsed.success) continue;
      const asset = parsed.data.assets.find((item) => item.reuseKey === reuseKey); if (!asset) continue;
      const resolved = path.resolve(root,asset.filePath); const rel = path.relative(root,resolved);
      if (rel.startsWith('..') || path.isAbsolute(rel)) continue;
      try { await access(resolved); return asset; } catch { continue; }
    }
  }
  return undefined;
}
