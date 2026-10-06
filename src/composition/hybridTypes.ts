import {z} from 'zod';

export const AssetReviewDecisionSchema=z.enum(['approved','rejected','pending']);
export const AssetReviewEntrySchema=z.strictObject({assetId:z.string().min(1),decision:AssetReviewDecisionSchema,notes:z.string().max(1000),reviewedAt:z.string().datetime()});
export const AssetReviewStateSchema=z.strictObject({episodeId:z.string().min(1),assets:z.array(AssetReviewEntrySchema)}).refine((state)=>new Set(state.assets.map((entry)=>entry.assetId)).size===state.assets.length,{message:'Asset review state cannot contain duplicate asset IDs.'});
export const HybridLayoutSchema=z.enum(['subject-left','subject-right','center-stage','full-field','split-focus','corner-anchor']);
export const HybridSceneFallbackSchema=z.strictObject({assetId:z.string(),assetKind:z.string(),decision:AssetReviewDecisionSchema,sceneId:z.string(),fallbackKind:z.enum(['agent-token','procedural','visual-plan-fallback']),reason:z.string()});
export const HybridStagedAssetSchema=z.strictObject({assetId:z.string(),reuseKey:z.string(),publicPath:z.string(),sha256:z.string().regex(/^[a-f0-9]{64}$/),hasAlpha:z.boolean(),assetKind:z.string(),semanticRisk:z.enum(['low','medium','high'])});
export const HybridInputSceneSchema=z.strictObject({sceneId:z.string(),strategy:z.enum(['procedural','recraft','hybrid','reuse']),resolvedStrategy:z.enum(['procedural','recraft','hybrid','reuse']),layout:HybridLayoutSchema,signatureMoment:z.boolean(),visualIntent:z.strictObject({primaryArchetype:z.string(),spatialLayout:z.string(),cameraIntent:z.string(),visualSubject:z.string(),motionIdea:z.string()}),assetIds:z.array(z.string()),fallbacks:z.array(HybridSceneFallbackSchema)});
export const HybridRenderInputSchema=z.strictObject({schemaVersion:z.literal('hybrid-render-input-v1'),episodeId:z.string(),allowPendingAssets:z.boolean(),reviewDecisions:z.array(z.strictObject({assetId:z.string(),decision:AssetReviewDecisionSchema})),scenes:z.array(HybridInputSceneSchema),stagedAssets:z.array(HybridStagedAssetSchema)});
export const HybridRenderReportSchema=z.strictObject({episodeId:z.string(),sceneCount:z.number().int().nonnegative(),proceduralSceneCount:z.number().int().nonnegative(),hybridSceneCount:z.number().int().nonnegative(),recraftSceneCount:z.number().int().nonnegative(),reuseSceneCount:z.number().int().nonnegative(),approvedAssetCount:z.number().int().nonnegative(),pendingAssetCount:z.number().int().nonnegative(),rejectedAssetCount:z.number().int().nonnegative(),fallbackCount:z.number().int().nonnegative(),fallbacks:z.array(HybridSceneFallbackSchema),layoutCounts:z.partialRecord(HybridLayoutSchema,z.number().int().nonnegative()),illustrationDominantSceneCount:z.number().int().nonnegative(),illustrationDominantSceneRatio:z.number().min(0).max(1),signatureMomentRendered:z.boolean(),stagedAssetCount:z.number().int().nonnegative(),renderStatus:z.enum(['rendered','DRAFT — UNREVIEWED ASSETS','failed']),outputPath:z.string().nullable(),warnings:z.array(z.string())});
export type AssetReviewDecision=z.infer<typeof AssetReviewDecisionSchema>;
export type AssetReviewState=z.infer<typeof AssetReviewStateSchema>;
export type HybridLayout=z.infer<typeof HybridLayoutSchema>;
export type HybridSceneFallback=z.infer<typeof HybridSceneFallbackSchema>;
export type HybridStagedAsset=z.infer<typeof HybridStagedAssetSchema>;
export type HybridInputScene=z.infer<typeof HybridInputSceneSchema>;
export type HybridRenderInput=z.infer<typeof HybridRenderInputSchema>;
export type HybridRenderReport=z.infer<typeof HybridRenderReportSchema>;
