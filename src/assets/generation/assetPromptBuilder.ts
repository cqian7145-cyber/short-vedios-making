import {readFile} from 'node:fs/promises';
import path from 'node:path';
import type {RecraftAssetBrief} from '../assetStrategySchema';
import type {RecraftImageRequest} from '../../recraft/types';

export const ASSET_PROMPT_VERSION = 'recraft-style-v1' as const;
export async function buildAssetPrompt(asset: RecraftAssetBrief, root = process.cwd()): Promise<string> {
  const prefix = (await readFile(path.join(root, 'prompts', `${ASSET_PROMPT_VERSION}.md`), 'utf8')).trim();
  const prompt = `${prefix}\nSUBJECT: ${asset.subject}\nASSET TYPE: ${asset.assetKind}\nCOMPOSITION: ${asset.composition ?? 'One primary subject, clearly separated.'}\nVIEWPOINT: ${asset.viewpoint ?? 'Three-quarter view.'}\nISOLATION: ${asset.isolation}\nAVOID: ${asset.avoidConcepts.length ? asset.avoidConcepts.join('; ') : 'extra subjects, labels, marks'}\nOne complete recognizable subject; clear silhouette, large negative space, suitable for dark-background compositing. No embedded text, numbers, formulas, charts, arrows, networks, logos, or infographic.`;
  if (prompt.length > 950) throw new Error(`Asset prompt is ${prompt.length} characters; the Recraft prompt budget is 950 characters before provider safety suffix.`);
  return prompt;
}

export function toRecraftRequest(asset: RecraftAssetBrief, prompt: string): RecraftImageRequest {
  const assetType: RecraftImageRequest['assetType'] = asset.assetKind === 'character' ? 'character' : asset.isolation === 'scene-plate' ? 'scene-plate' : 'object';
  return {subject: asset.subject, assetType, composition: asset.composition, viewpoint: asset.viewpoint, avoidConcepts: [...asset.avoidConcepts,'embedded text','numbers','labels','logos'], preparedPrompt: prompt};
}
