import {createHash} from 'node:crypto';
import {access, readFile} from 'node:fs/promises';
import path from 'node:path';
import {inspectPng} from '../generation/assetValidator';
import {LibraryIndexSchema, type LibraryAsset, type LibraryIndex} from './librarySchema';

export const libraryIndexPath = (root: string) => path.join(root, 'assets', 'library', 'library-index.json');
export const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
export function inspectAsset(bytes: Buffer, format: 'png'|'svg') {
  if (format === 'png') return inspectPng(bytes);
  const svg = bytes.toString('utf8');
  if (!/^\s*<svg\b/i.test(svg) || /<script\b|\son\w+\s*=|javascript:|<foreignObject\b/i.test(svg)) throw new Error('SVG is invalid or contains active content.');
  const tag = svg.match(/<svg\b[^>]*>/i)?.[0] ?? '';
  const width = Number(tag.match(/\bwidth=["']([\d.]+)/i)?.[1]); const height = Number(tag.match(/\bheight=["']([\d.]+)/i)?.[1]);
  const viewBox = tag.match(/\bviewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/i);
  const w = width || Number(viewBox?.[1]); const h = height || Number(viewBox?.[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) throw new Error('SVG must declare positive dimensions or a valid viewBox.');
  return {width: Math.round(w), height: Math.round(h), hasAlpha: !/\bfill=["'](?:white|#fff(?:fff)?|rgb\(255\s*,\s*255\s*,\s*255\))["']/i.test(svg), format: 'svg' as const};
}
export async function readLibraryIndex(root: string): Promise<LibraryIndex> {
  try { return LibraryIndexSchema.parse(JSON.parse(await readFile(libraryIndexPath(root), 'utf8')) as unknown); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {schemaVersion: 'asset-library-index-v1', assets: []}; throw new Error(`Asset Library index is invalid: ${error instanceof Error ? error.message : 'unknown error'}`); }
}
export async function writeLibraryIndex(root: string, index: LibraryIndex): Promise<void> {
  const file = libraryIndexPath(root); const {mkdir, rename, writeFile} = await import('node:fs/promises');
  await mkdir(path.dirname(file), {recursive: true}); await writeFile(`${file}.tmp`, `${JSON.stringify(LibraryIndexSchema.parse(index), null, 2)}\n`, 'utf8'); await rename(`${file}.tmp`, file);
}
export async function validateLibraryAssetFile(root: string, asset: LibraryAsset): Promise<{ok: boolean; warning?: string}> {
  const file = path.resolve(root, asset.filePath); const relative = path.relative(path.resolve(root), file);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return {ok: false, warning: `${asset.id}: path escapes the workspace.`};
  try { await access(file); const bytes = await readFile(file); const info = inspectAsset(bytes, asset.format); if (sha256(bytes) !== asset.contentHash) return {ok: false, warning: `${asset.id}: content hash mismatch.`}; if (info.width !== asset.width || info.height !== asset.height) return {ok: false, warning: `${asset.id}: dimensions do not match index metadata.`}; return {ok: true}; }
  catch { return {ok: false, warning: `${asset.id}: missing or invalid ${asset.format.toUpperCase()} binary.`}; }
}
