import {z} from 'zod';

export const FACTORY_V2_STAGES = [
  '01 PREFLIGHT', '02 CONTENT BRIEF', '03 RESEARCH', '04 FACT PACK', '05 VERIFIED EPISODE',
  '06 VISUAL PLAN', '07 ASSET PLAN', '08 ASSET RESOLUTION', '09 ASSET GENERATION',
  '10 DRAFT HYBRID RENDER', '11 VISUAL QA', '12 HUMAN REVIEW GATE', '13 RELEASE RENDER', '14 DELIVERY PACKAGE',
] as const;
export const FactoryV2StatusSchema = z.enum(['pending','running','paused','awaiting-human-review','changes-requested','release-ready','completed','failed']);
export const FactoryV2StageStatusSchema = z.enum(['pending','running','completed','failed','skipped']);
export const FactoryV2StageSchema = z.strictObject({status: FactoryV2StageStatusSchema, fingerprint: z.string().optional(), startedAt: z.string().optional(), completedAt: z.string().optional(), durationMs: z.number().nonnegative().optional(), message: z.string().optional(), errorCategory: z.string().optional(), retryable: z.boolean().optional()});
export const FactoryV2StateSchema = z.strictObject({schemaVersion:z.literal('factory-v2-state-v1'),episodeId:z.string(),topic:z.string(),durationSeconds:z.number().positive(),status:FactoryV2StatusSchema,mode:z.enum(['draft','release']),stages:z.record(z.enum(FACTORY_V2_STAGES),FactoryV2StageSchema),updatedAt:z.string().datetime(),lastError:z.string().optional()});
export const FactoryV2ReviewSchema = z.strictObject({episodeId:z.string(),decision:z.enum(['approved','changes-requested','pending']),notes:z.string().max(2000),reviewedAt:z.string().datetime(),assetDecisions:z.array(z.strictObject({assetId:z.string(),decision:z.enum(['approved','rejected','pending'])})),reviewedQaFingerprint:z.string().optional(),acknowledgedWarningCodes:z.array(z.string()).optional()});
export const FactoryV2ReportSchema = z.strictObject({schemaVersion:z.literal('factory-v2-report-v1'),episodeId:z.string(),topic:z.string(),durationSeconds:z.number(),status:FactoryV2StatusSchema,mode:z.enum(['draft','release']),stages:z.record(z.enum(FACTORY_V2_STAGES),FactoryV2StageSchema),providerCalls:z.strictObject({deepseek:z.number().int().nonnegative(),tavily:z.number().int().nonnegative(),recraft:z.number().int().nonnegative()}),cacheHits:z.number().int().nonnegative(),libraryHits:z.number().int().nonnegative(),proceduralFallbacks:z.number().int().nonnegative(),warnings:z.array(z.string()),humanGate:z.enum(['required','approved','changes-requested','not-reached']),outputPaths:z.record(z.string(),z.string()),updatedAt:z.string().datetime()});
export type FactoryV2State = z.infer<typeof FactoryV2StateSchema>;
export type FactoryV2StageName = typeof FACTORY_V2_STAGES[number];
export type FactoryV2Stage = z.infer<typeof FactoryV2StageSchema>;
export type FactoryV2Review = z.infer<typeof FactoryV2ReviewSchema>;
export type FactoryV2Report = z.infer<typeof FactoryV2ReportSchema>;
