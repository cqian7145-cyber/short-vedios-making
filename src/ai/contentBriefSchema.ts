import {z} from 'zod';

export const ResearchRiskSchema = z.strictObject({
  claim: z.string().min(1).max(500),
  reason: z.string().min(1).max(500),
  needsResearch: z.boolean(),
});

export const ContentBriefSchema = z.strictObject({
  topic: z.string().min(1).max(300),
  centralQuestion: z.string().min(1).max(300),
  commonIntuition: z.string().min(1).max(600),
  counterintuitiveResult: z.string().min(1).max(600),
  mechanism: z.array(z.string().min(1).max(400)).min(2).max(6),
  visualMetaphor: z.string().min(1).max(400),
  endingInsight: z.string().min(1).max(300),
  suggestedSceneFlow: z.array(z.strictObject({
    sceneType: z.enum(['hook', 'setup', 'history', 'diagram', 'simulation', 'comparison', 'reveal', 'explanation', 'ending']),
    purpose: z.string().min(1).max(300),
    durationSeconds: z.number().finite().positive().max(180),
  })).min(6).max(12),
  riskFlags: z.array(ResearchRiskSchema).max(30),
});

export type ContentBrief = z.infer<typeof ContentBriefSchema>;
export type ResearchRisk = z.infer<typeof ResearchRiskSchema>;
