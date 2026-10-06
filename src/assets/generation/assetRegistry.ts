import {access, readFile} from 'node:fs/promises';
import path from 'node:path';
import {AssetGenerationManifestSchema, type GeneratedAsset} from './assetGenerationSchema';

export async function findReusableAsset(root: string, reuseKey: string): Promise<GeneratedAsset | undefined> {
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
