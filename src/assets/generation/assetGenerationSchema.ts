import {z} from 'zod';
import {RecraftAssetKindSchema, SemanticRiskSchema} from '../assetStrategySchema';

export const GeneratedAssetSchema = z.strictObject({
  id: z.string().min(1), reuseKey: z.string().min(1), assetKind: RecraftAssetKindSchema,
  subject: z.string().min(1), episodeId: z.string().min(1), sceneIds: z.array(z.string()),
  provider: z.literal('recraft'), profileVersion: z.literal('recraft-v1'), promptVersion: z.literal('recraft-style-v1'),
  prompt: z.string().min(1), cacheKey: z.string().regex(/^[a-f0-9]{64}$/), filePath: z.string().min(1),
  width: z.number().int().positive(), height: z.number().int().positive(), format: z.literal('png'),
  hasAlpha: z.boolean(), backgroundMode: z.literal('generated'), createdAt: z.string().datetime(),
  semanticRisk: SemanticRiskSchema, status: z.enum(['needs-human-review']), warnings: z.array(z.string()),
});

export const AssetGenerationManifestSchema = z.strictObject({schemaVersion: z.literal('asset-generation-manifest-v1'), episodeId: z.string().min(1), assets: z.array(GeneratedAssetSchema)});
export const AssetGenerationStateSchema = z.strictObject({schemaVersion: z.literal('asset-generation-state-v1'), episodeId: z.string().min(1), assets: z.array(z.strictObject({assetId: z.string(), cacheKey: z.string(), status: z.enum(['pending','generating','ready','failed','skipped']), error: z.string().optional()}))});
export const AssetGenerationReportSchema = z.strictObject({
  episodeId: z.string().min(1), profileVersion: z.literal('recraft-v1'), styleConfigured: z.boolean(), requestedAssetCount: z.number().int().nonnegative(),
  newGenerationCount: z.number().int().nonnegative(), cacheHitCount: z.number().int().nonnegative(), reuseCount: z.number().int().nonnegative(),
  successCount: z.number().int().nonnegative(), failureCount: z.number().int().nonnegative(), skippedHighRiskCount: z.number().int().nonnegative(),
  recraftCallCount: z.number().int().nonnegative(), budget: z.strictObject({requested: z.number().int().nonnegative(), hardMax: z.number().int().positive()}),
  fallbackRequired: z.boolean(), status: z.enum(['pass','warning','fail']), createdAt: z.string().datetime(),
  assets: z.array(z.strictObject({assetId: z.string(), reuseKey: z.string(), status: z.enum(['cache-hit','reused','generated','failed','skipped-high-risk']), filePath: z.string().optional(), cacheKey: z.string(), error: z.string().optional()})),
  warnings: z.array(z.string()),
});

export type GeneratedAsset = z.infer<typeof GeneratedAssetSchema>;
export type AssetGenerationManifest = z.infer<typeof AssetGenerationManifestSchema>;
export type AssetGenerationState = z.infer<typeof AssetGenerationStateSchema>;
export type AssetGenerationReport = z.infer<typeof AssetGenerationReportSchema>;
