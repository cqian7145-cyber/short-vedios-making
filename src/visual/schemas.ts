import {z} from 'zod';

export const VISUAL_ARCHETYPES = [
  'network', 'agents', 'physical_system', 'geometric', 'probability', 'data_curve',
  'timeline_archive', 'object_world', 'process_flow', 'field_wave', 'scale_comparison', 'spatial_map',
] as const;
export const VisualArchetypeSchema = z.enum(VISUAL_ARCHETYPES);
export const VisualCameraIntentSchema = z.enum(['slow_push_in', 'slow_pull_back', 'drift', 'locked', 'tracking', 'reframe']);
export const VisualScenePlanSchema = z.strictObject({
  sceneId: z.string().min(1).max(100),
  primaryArchetype: VisualArchetypeSchema,
  secondaryArchetype: VisualArchetypeSchema.optional(),
  visualSubject: z.string().min(1).max(500),
  motionIdea: z.string().min(1).max(500),
  cameraIntent: VisualCameraIntentSchema,
  spatialLayout: z.string().min(1).max(300),
  continuityFromPrevious: z.string().max(400),
  reuseExistingPrimitive: z.string().min(1).max(240),
  requiredCapabilities: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)).max(12),
  fallbackArchetype: VisualArchetypeSchema.optional(),
  textDominant: z.boolean(),
});
export const VisualPlanSchema = z.strictObject({
  episodeArchetype: VisualArchetypeSchema,
  persistentMotif: z.string().min(1).max(300),
  signatureMoment: z.string().min(1).max(600),
  scenePlans: z.array(VisualScenePlanSchema).min(1).max(100),
  preferredExternalAsset: z.enum(['none', 'canva_candidate']).default('none'),
});
export const VisualDirectorSchema = VisualPlanSchema;
export const VisualDiversityReportSchema = z.strictObject({
  uniqueArchetypes: z.number().int().nonnegative(),
  primaryArchetypes: z.array(VisualArchetypeSchema),
  longestRepeatedRun: z.number().int().nonnegative(),
  networkSceneRatio: z.number().min(0).max(1),
  textDominantSceneRatio: z.number().min(0).max(1),
  signatureMomentPresent: z.boolean(),
  visualDiversityScore: z.number().int().min(0).max(100),
  warnings: z.array(z.string()),
});

export type VisualArchetype = z.infer<typeof VisualArchetypeSchema>;
export type VisualScenePlan = z.infer<typeof VisualScenePlanSchema>;
export type VisualPlan = z.infer<typeof VisualPlanSchema>;
export type VisualDiversityReport = z.infer<typeof VisualDiversityReportSchema>;
