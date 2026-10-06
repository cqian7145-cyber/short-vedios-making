import {createHash} from 'node:crypto';
import path from 'node:path';

export function makeAssetCacheKey(input: {reuseKey: string; profileVersion: string; prompt: string; assetKind: string; composition?: string; modelFamily?: string}): string {
  return createHash('sha256').update(JSON.stringify({reuseKey: input.reuseKey, profileVersion: input.profileVersion, prompt: input.prompt, assetKind: input.assetKind, composition: input.composition ?? '', modelFamily: input.modelFamily ?? 'recraftv3'})).digest('hex');
}
export function cacheAssetPath(root: string, reuseKey: string, cacheKey: string): string { return path.join(root,'assets','cache','recraft',reuseKey,`${cacheKey}.png`); }
