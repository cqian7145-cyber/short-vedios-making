import type {LibraryAsset} from './librarySchema';

export type MatchReason = 'reuseKey' | 'canonicalName' | 'alias' | 'subject' | 'tag';
export type ScoredLibraryAsset = {asset: LibraryAsset; score: number; reason: MatchReason; automatic: boolean};
export const AUTO_REUSE_THRESHOLD = 80;
export function normalizeAssetQuery(value: string): string { return value.toLowerCase().trim().replace(/[_\s]+/g, '-').replace(/-+/g, '-'); }
export function scoreLibraryAsset(asset: LibraryAsset, request: {reuseKey?: string; canonicalName?: string; query: string; tags?: string[]}): ScoredLibraryAsset | undefined {
  const query = normalizeAssetQuery(request.query);
  if (request.reuseKey && normalizeAssetQuery(asset.reuseKey) === normalizeAssetQuery(request.reuseKey)) return {asset, score: 100, reason: 'reuseKey', automatic: true};
  if (request.canonicalName && normalizeAssetQuery(asset.canonicalName) === normalizeAssetQuery(request.canonicalName)) return {asset, score: 95, reason: 'canonicalName', automatic: true};
  if (asset.aliases.some((alias) => normalizeAssetQuery(alias) === query) || asset.aliases.some((alias) => normalizeAssetQuery(alias) === normalizeAssetQuery(request.reuseKey ?? ''))) return {asset, score: 90, reason: 'alias', automatic: true};
  if (normalizeAssetQuery(asset.subject) === query || normalizeAssetQuery(asset.canonicalName) === query) return {asset, score: 85, reason: 'subject', automatic: true};
  const wantedTags = new Set([...(request.tags ?? []), ...query.split('-')].map(normalizeAssetQuery));
  if (asset.tags.some((tag) => wantedTags.has(normalizeAssetQuery(tag))) && wantedTags.size > 0) return {asset, score: 70, reason: 'tag', automatic: false};
  return undefined;
}
