import {z} from 'zod';

export const SourceTierSchema = z.enum(['A', 'B', 'C']);
export const ResearchSourceSchema = z.strictObject({
  id: z.string().regex(/^source-[a-z0-9-]{2,80}$/),
  title: z.string().min(1).max(500),
  url: z.string().url().max(2048),
  domain: z.string().min(1).max(255),
  snippet: z.string().max(3000),
  publishedDate: z.string().max(80).optional(),
  sourceTier: SourceTierSchema,
  retrievedAt: z.string().datetime(),
});
export const FactClaimSchema = z.strictObject({
  id: z.string().regex(/^claim-[a-z0-9-]{2,80}$/),
  claim: z.string().min(1).max(700),
  status: z.enum(['verified', 'partially_supported', 'unverified', 'contradicted']),
  confidence: z.enum(['high', 'medium', 'low']),
  sourceIds: z.array(z.string().regex(/^source-[a-z0-9-]{2,80}$/)).max(30),
  notes: z.string().max(1200),
  key: z.boolean().default(true),
});
export const FactPackSchema = z.strictObject({
  topic: z.string().min(1).max(500),
  summary: z.string().min(1).max(2000),
  verifiedClaims: z.array(FactClaimSchema),
  uncertainClaims: z.array(FactClaimSchema),
  contradictedClaims: z.array(FactClaimSchema),
  safeConceptualClaims: z.array(z.string().min(1).max(500)).max(30),
  sources: z.array(ResearchSourceSchema).max(100),
  publicationReady: z.boolean(),
}).superRefine((pack, context) => {
  const sourceIds = new Set(pack.sources.map((source) => source.id));
  const claims = [...pack.verifiedClaims, ...pack.uncertainClaims, ...pack.contradictedClaims];
  for (const claim of claims) {
    claim.sourceIds.forEach((sourceId, index) => {
      if (!sourceIds.has(sourceId)) context.addIssue({code: 'custom', path: ['claims', claim.id, 'sourceIds', index], message: `Unknown source id ${sourceId}.`});
    });
    if (pack.verifiedClaims.includes(claim) && (claim.status !== 'verified' || claim.confidence !== 'high')) {
      context.addIssue({code: 'custom', path: ['verifiedClaims', claim.id], message: 'Verified claims require high confidence.'});
    }
    if (pack.uncertainClaims.includes(claim) && !['partially_supported', 'unverified'].includes(claim.status)) {
      context.addIssue({code: 'custom', path: ['uncertainClaims', claim.id], message: 'Uncertain claims must be partially supported or unverified.'});
    }
    if (pack.contradictedClaims.includes(claim) && claim.status !== 'contradicted') {
      context.addIssue({code: 'custom', path: ['contradictedClaims', claim.id], message: 'Contradicted claims must use contradicted status.'});
    }
  }
  if (pack.publicationReady && claims.some((claim) => claim.key && ['unverified', 'contradicted'].includes(claim.status))) {
    context.addIssue({code: 'custom', path: ['publicationReady'], message: 'Publication readiness cannot pass with a key unverified or contradicted claim.'});
  }
});
export const ResearchQueryPlanSchema = z.strictObject({
  queries: z.array(z.string().min(3).max(240)).min(3).max(8),
});
export const ClaimAssessmentSchema = z.strictObject({
  id: z.string().regex(/^claim-[a-z0-9-]{2,80}$/),
  claim: z.string().min(1).max(700),
  status: z.enum(['verified', 'partially_supported', 'unverified', 'contradicted']),
  confidence: z.enum(['high', 'medium', 'low']),
  sourceIds: z.array(z.string().regex(/^source-[a-z0-9-]{2,80}$/)).max(30),
  notes: z.string().max(1200),
  key: z.boolean(),
});
export const FactAssessmentSchema = z.strictObject({
  summary: z.string().min(1).max(2000),
  claims: z.array(ClaimAssessmentSchema).max(30),
});

export type ResearchSource = z.infer<typeof ResearchSourceSchema>;
export type FactClaim = z.infer<typeof FactClaimSchema>;
export type FactPack = z.infer<typeof FactPackSchema>;
export type ResearchQueryPlan = z.infer<typeof ResearchQueryPlanSchema>;
export type FactAssessment = z.infer<typeof FactAssessmentSchema>;
