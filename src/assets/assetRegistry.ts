import {access, readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {AssetRegistrySchema, type AssetRegistryEntry} from './assetStrategySchema';

const REGISTRY_FILE_NAMES = new Set(['asset-registry.json', 'registry.json']);

async function findRegistryFiles(directory: string): Promise<string[]> {
  let entries;
  try { entries = await readdir(directory, {withFileTypes: true}); }
  catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return [];
    throw new Error('Could not scan the local asset registry directories.');
  }
  const found: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await findRegistryFiles(fullPath));
    else if (entry.isFile() && REGISTRY_FILE_NAMES.has(entry.name.toLowerCase())) found.push(fullPath);
  }
  return found;
}

export async function loadAssetRegistry(root = process.cwd()): Promise<{assets: AssetRegistryEntry[]; warnings: string[]}> {
  const directories = [path.join(root, 'assets', 'generated'), path.join(root, 'assets', 'library')];
  const files = (await Promise.all(directories.map(findRegistryFiles))).flat();
  const assets: AssetRegistryEntry[] = [];
  const warnings: string[] = [];
  for (const file of files) {
    let value: unknown;
    try { value = JSON.parse(await readFile(file, 'utf8')) as unknown; }
    catch { throw new Error(`Asset registry JSON is unreadable: ${path.relative(root, file)}.`); }
    const parsed = AssetRegistrySchema.safeParse(value);
    if (!parsed.success) throw new Error(`Asset registry schema is invalid: ${path.relative(root, file)}.`);
    for (const asset of parsed.data.assets) {
      if (!asset.path) {
        warnings.push(`Registry asset ${asset.id} has no local path and cannot be reused.`);
        continue;
      }
      const resolved = path.resolve(root, asset.path);
      const relative = path.relative(root, resolved);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        warnings.push(`Registry asset ${asset.id} points outside the workspace and was ignored.`);
        continue;
      }
      try { await access(resolved); }
      catch { warnings.push(`Registry asset ${asset.id} has a missing file and cannot be reused.`); continue; }
      assets.push(asset);
    }
  }
  return {assets, warnings};
}
