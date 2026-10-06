import {z} from 'zod';

export const ASSET_STRATEGIES = ['procedural', 'recraft', 'hybrid', 'reuse'] as const;
export const AssetStrategySchema = z.enum(ASSET_STRATEGIES);
export const RECRAFT_ASSET_KINDS = [
  'character', 'object', 'machine', 'vehicle', 'architecture', 'industrial-object',
  'editorial-illustration', 'symbolic-object',
] as const;
export const RecraftAssetKindSchema = z.enum(RECRAFT_ASSET_KINDS);
export const SemanticRiskSchema = z.enum(['low', 'medium', 'high']);

const semanticText = z.string().trim().min(1).max(500)
  .refine((value) => !/(?:#[0-9a-f]{3,8}\b|\b\d+\s*px\b|font-size|react\s*code|<\/?(?:svg|div|canvas)\b|style\s*=)/i.test(value), {
    message: 'Use semantic descriptions only; layout code, styles, and pixel geometry are not allowed.',
  });
const semanticElement = z.string().trim().min(1).max(120)
  .refine((value) => !/(?:#[0-9a-f]{3,8}\b|\b\d+\s*px\b|font-size|react\s*code|<\/?(?:svg|div|canvas)\b|style\s*=)/i.test(value), {
    message: 'Use a semantic element name; code, styles, and pixel geometry are not allowed.',
  });

export const RecraftAssetBriefSchema = z.strictObject({
  assetId: z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/),
  assetKind: RecraftAssetKindSchema,
  subject: semanticText,
  composition: semanticText.optional(),
  viewpoint: semanticText.optional(),
  isolation: z.enum(['isolated', 'scene-plate']),
  reuseKey: z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/),
  semanticRisk: SemanticRiskSchema,
  avoidConcepts: z.array(z.string().trim().min(1).max(100).refine((value) => !/(?:#[0-9a-f]{3,8}\b|\b\d+\s*px\b|<\/?(?:svg|div|canvas)\b)/i.test(value))).max(8),
  source: z.enum(['new', 'registry', 'episode', 'library']).optional(),
  libraryAssetId: z.string().min(1).optional(),
}).strict();

export const SceneAssetPlanSchema = z.strictObject({
  sceneId: z.string().min(1).max(100),
  strategy: AssetStrategySchema,
  reason: semanticText,
  recraftAssets: z.array(RecraftAssetBriefSchema).max(12),
  proceduralElements: z.array(semanticElement).max(30),
  fallback: z.enum(['procedural', 'curated-svg']),
  requiresNewAsset: z.boolean(),
  overrideReason: z.string().min(1).max(400).optional(),
}).strict();

export const AssetBudgetSchema = z.strictObject({
  episodeDurationSeconds: z.number().positive(),
  recommendedMin: z.number().int().nonnegative(),
  recommendedMax: z.number().int().positive(),
  hardMax: z.number().int().positive(),
  uniqueNewAssetCount: z.number().int().nonnegative(),
  utilization: z.number().min(0),
}).strict();

export const ReuseGroupSchema = z.strictObject({
  reuseKey: z.string().min(1),
  assetId: z.string().min(1),
  sceneIds: z.array(z.string().min(1)).min(1),
  source: z.enum(['new', 'registry', 'library']),
}).strict();

export const AssetPlanSchema = z.strictObject({
  episodeId: z.string().min(1),
  profileVersion: z.literal('recraft-v1'),
  styleStatus: z.enum(['locked', 'missing']),
  budget: AssetBudgetSchema,
  scenePlans: z.array(SceneAssetPlanSchema).min(1),
  uniqueRecraftAssets: z.array(RecraftAssetBriefSchema),
  reuseGroups: z.array(ReuseGroupSchema),
  warnings: z.array(z.string().max(500).refine((value) => !/(?:#[0-9a-f]{3,8}\b|\b\d+\s*px\b|<\/?(?:svg|div|canvas)\b)/i.test(value))),
}).strict();

export const AssetStrategyReportSchema = z.strictObject({
  episodeId: z.string().min(1),
  sceneCount: z.number().int().nonnegative(),
  strategyCounts: z.strictObject({procedural: z.number().int().nonnegative(), recraft: z.number().int().nonnegative(), hybrid: z.number().int().nonnegative(), reuse: z.number().int().nonnegative()}),
  uniqueRecraftAssetCount: z.number().int().nonnegative(),
  recraftBudget: z.strictObject({recommendedMin: z.number().int(), recommendedMax: z.number().int(), hardMax: z.number().int()}),
  budgetUtilization: z.number().min(0),
  highRiskAssetCount: z.number().int().nonnegative(),
  policyOverrideCount: z.number().int().nonnegative(),
  reuseCount: z.number().int().nonnegative(),
  proceduralOnlyElements: z.array(z.string()),
  recraftSceneRatio: z.number().min(0).max(1),
  warnings: z.array(z.string()),
  status: z.enum(['pass', 'warning', 'fail']),
}).strict();

export const AssetRegistryEntrySchema = z.strictObject({
  id: z.string().min(1),
  reuseKey: z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/),
  assetKind: RecraftAssetKindSchema,
  subject: semanticText,
  profileVersion: z.string().min(1),
  provider: z.enum(['recraft','curated']),
  path: z.string().min(1).optional(),
  createdAt: z.string().datetime().optional(),
  episodeIds: z.array(z.string()).optional(),
}).strict();

export const AssetRegistrySchema = z.strictObject({
  schemaVersion: z.literal('asset-registry-v1'),
  assets: z.array(AssetRegistryEntrySchema),
}).strict();

export const AssetSceneProposalSchema = z.strictObject({
  sceneId: z.string().min(1).max(100),
  strategy: AssetStrategySchema,
  reason: semanticText,
  recraftAssets: z.array(RecraftAssetBriefSchema.omit({source: true, libraryAssetId: true})).max(12),
  proceduralElements: z.array(semanticElement).max(30),
  fallback: z.enum(['procedural', 'curated-svg']),
}).strict();

export const AssetStrategyProposalSchema = z.strictObject({
  scenePlans: z.array(AssetSceneProposalSchema).min(1).max(100),
}).strict();

export type RecraftAssetBrief = z.infer<typeof RecraftAssetBriefSchema>;
export type AssetScenePlan = z.infer<typeof SceneAssetPlanSchema>;
export type AssetPlan = z.infer<typeof AssetPlanSchema>;
export type AssetStrategyReport = z.infer<typeof AssetStrategyReportSchema>;
export type AssetRegistryEntry = z.infer<typeof AssetRegistryEntrySchema>;
export type AssetSceneProposal = z.infer<typeof AssetSceneProposalSchema>;
export type AssetStrategyProposal = z.infer<typeof AssetStrategyProposalSchema>;
