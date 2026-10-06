import {z} from 'zod';

const bool=z.boolean();
const nullableNumber=z.number().nullable();
export const QaSeveritySchema=z.enum(['info','warning','critical']);
export const QaWarningSchema=z.strictObject({code:z.string().min(1),severity:QaSeveritySchema,message:z.string().min(1),sceneIds:z.array(z.string()).default([])});
export const RecommendationSchema=z.strictObject({priority:z.enum(['high','medium','low']),title:z.string(),action:z.string(),sceneIds:z.array(z.string()).default([])});
export const InputFingerprintsSchema=z.strictObject({episode:z.string(),visualPlan:z.string(),assetPlan:z.string(),hybridReport:z.string().optional(),stills:z.record(z.string(),z.string())});
export const PaletteSummarySchema=z.strictObject({meanLuminance:z.number().min(0).max(1),meanSaturation:z.number().min(0).max(1),darkPixelRatio:z.number().min(0).max(1),coarseHue:z.number().int().min(0).max(7)});
export const SceneQaSummarySchema=z.strictObject({sceneId:z.string(),layout:z.string(),archetype:z.string(),strategy:z.string(),assetKinds:z.array(z.string()),assetIds:z.array(z.string()),proceduralElements:z.array(z.string()),structuralSignature:z.string(),illustrationDominant:bool,textDominant:bool,signatureMoment:bool,stillPath:z.string().optional(),stillHash:z.string().optional(),palette:PaletteSummarySchema.optional()});
const PairSchema=z.object({sceneA:z.string(),sceneB:z.string(),similarity:z.number()});
const WithinEpisodeSchema=z.object({
  sceneCount:z.number(),durationSeconds:z.number(),
  layouts:z.object({uniqueLayoutCount:z.number(),longestRepeatedLayoutRun:z.number(),dominantLayoutRatio:z.number(),counts:z.record(z.string(),z.number())}),
  archetypes:z.object({uniqueArchetypes:z.number(),longestRepeatedArchetypeRun:z.number(),dominantArchetypeRatio:z.number(),counts:z.record(z.string(),z.number())}),
  assetRepetition:z.object({uniqueAssets:z.number(),totalPlacements:z.number(),mostUsedAsset:z.string().nullable(),mostUsedCount:z.number(),repetitionRatio:z.number(),persistentMotifExemption:bool}),
  illustrationDominance:z.object({sceneCount:z.number(),ratio:z.number(),productionMix:z.record(z.string(),z.number())}),
  frameSimilarity:z.object({method:z.string(),availableFrames:z.number(),comparedPairs:z.number(),averageSimilarity:nullableNumber,mostSimilarPair:PairSchema.nullable(),highSimilarityPairs:z.array(PairSchema.extend({discountedTransition:bool})),note:z.string()}),
  palette:z.object({episodeMedianLuminance:nullableNumber,episodeMedianSaturation:nullableNumber,driftCandidates:z.array(z.object({sceneId:z.string(),luminance:z.number(),saturation:z.number(),signatureExempt:bool})),darkCompatibility:z.string()}),
  textDominantSceneRatio:z.number(),
  structuralRepetition:z.object({uniqueSignatures:z.number(),longestRepeatedRun:z.number(),dominantRatio:z.number(),repeatedSceneIds:z.array(z.string())}),
  signatureDistinctiveness:z.object({sceneId:z.string().nullable(),layoutDifferentFromNeighbors:bool,archetypeDifferentFromNeighbors:bool,frameDistinctFromNeighbors:bool,distinctive:z.union([bool,z.null()])}),
  scenes:z.array(SceneQaSummarySchema),
});
const CrossEpisodeSchema=z.object({comparedEpisodeIds:z.array(z.string()),historyLimit:z.number(),metadataOnlyEpisodeIds:z.array(z.string()),crossEpisodeHighSimilarityPairs:z.array(z.object({episodeId:z.string(),currentSceneId:z.string(),previousSceneHash:z.string(),similarity:z.number()})),assetReuse:z.array(z.object({assetId:z.string(),episodeCount:z.number(),episodeIds:z.array(z.string())})),openingRepeated:bool,endingRepeated:bool,notes:z.array(z.string())});
const PhaseComparisonSchema=z.object({pairedFrames:z.number(),averageSimilarity:nullableNumber,pairs:z.array(z.object({sceneId:z.string(),phase1Path:z.string(),hybridPath:z.string(),similarity:z.number()})),note:z.string()}).nullable();
export const VisualQaReportSchema=z.strictObject({
  schemaVersion:z.literal('visual-qa-v1'),episodeId:z.string(),createdAt:z.string().datetime(),
  methodology:z.literal('heuristic editorial QA; deterministic local metrics, not scientific or AI visual understanding'),
  stale:bool,priorReportStale:bool,inputFingerprints:InputFingerprintsSchema,withinEpisode:WithinEpisodeSchema,crossEpisode:CrossEpisodeSchema,phase1Comparison:PhaseComparisonSchema,
  scores:z.object({layoutDiversity:z.number(),archetypeDiversity:z.number(),frameSimilarity:z.number(),structuralDiversity:z.number(),paletteConsistency:z.number(),assetReuseHealth:z.number(),illustrationBalance:z.number(),signatureDistinctiveness:z.number(),total:z.number(),status:z.enum(['pass','warning','fail'])}),
  warnings:z.array(QaWarningSchema),recommendations:z.array(RecommendationSchema),status:z.enum(['pass','warning','fail']),
  gate:z.object({result:z.enum(['pass','warning','fail']),releaseModeAction:z.enum(['continue','human-review-required','stop'])}),
  sourcePaths:z.object({episode:z.string(),visualPlan:z.string(),assetPlan:z.string(),hybridReport:z.string().optional(),stillsDirectory:z.string().optional(),phase1StillsDirectory:z.string().optional()}),
});
export type VisualQaReport=z.infer<typeof VisualQaReportSchema>;
export type QaWarning=z.infer<typeof QaWarningSchema>;
export type QaRecommendation=z.infer<typeof RecommendationSchema>;
export type SceneQaSummary=z.infer<typeof SceneQaSummarySchema>;
export type InputFingerprints=z.infer<typeof InputFingerprintsSchema>;

export const QaHistoryEntrySchema=z.strictObject({episodeId:z.string(),timestamp:z.string().datetime(),score:z.number(),reportPath:z.string(),representativeStillHashes:z.record(z.string(),z.string()),layoutSummary:z.record(z.string(),z.number()),archetypeSummary:z.record(z.string(),z.number()),assetSummary:z.record(z.string(),z.number()),sceneStructures:z.array(z.object({sceneId:z.string(),structuralSignature:z.string(),assetIds:z.array(z.string()),stillHash:z.string().optional()})),hookSignature:z.string().nullable(),endingSignature:z.string().nullable(),inputFingerprints:InputFingerprintsSchema});
export const QaHistorySchema=z.strictObject({schemaVersion:z.literal('visual-qa-history-v1'),episodes:z.array(QaHistoryEntrySchema).max(20)});
export type QaHistoryEntry=z.infer<typeof QaHistoryEntrySchema>;
