import {z} from 'zod';
import {RecraftAssetKindSchema} from '../assetStrategySchema';

export const LibraryAssetSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/),
  canonicalName: z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/),
  assetKind: RecraftAssetKindSchema,
  subject: z.string().min(1).max(500),
  provider: z.enum(['recraft', 'curated']),
  provenance: z.enum(['generated-approved', 'human-curated']),
  profileVersion: z.string().min(1),
  reuseKey: z.string().min(1),
  tags: z.array(z.string().min(1).max(80)),
  aliases: z.array(z.string().min(1).max(120)),
  filePath: z.string().min(1),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  width: z.number().int().positive(), height: z.number().int().positive(),
  format: z.enum(['png', 'svg']), hasAlpha: z.boolean(),
  backgroundMode: z.enum(['transparent', 'generated', 'solid', 'unknown']),
  reviewStatus: z.literal('approved'), approvedAt: z.string().datetime(), createdAt: z.string().datetime(),
  sourceEpisodeId: z.string().optional(), sourceAssetId: z.string().optional(),
  usageCount: z.number().int().nonnegative(), lastUsedAt: z.string().datetime().optional(),
  licenseStatus: z.enum(['original', 'user-owned', 'licensed']), notes: z.string().max(1000).optional(),
  visualRole: z.enum(['isolated-subject', 'supporting-subject', 'scene-plate', 'icon']),
  enabled: z.boolean(), reviewSource: z.literal('human'),
  usage: z.array(z.strictObject({episodeId: z.string().min(1), sceneId: z.string().min(1), usedAt: z.string().datetime()})).default([]),
  sourceReferences: z.array(z.strictObject({episodeId: z.string().min(1), assetId: z.string().min(1)})).default([]),
});

export const LibraryIndexSchema = z.strictObject({schemaVersion: z.literal('asset-library-index-v1'), assets: z.array(LibraryAssetSchema)});
export type LibraryAsset = z.infer<typeof LibraryAssetSchema>;
export type LibraryIndex = z.infer<typeof LibraryIndexSchema>;
export const LibraryAssetManifestSchema = LibraryAssetSchema;
