import { RecraftStyleValidationReportSchema } from './schemas';

export type StyleScoreInput = {
  semanticAccuracy: number;
  styleConsistency: number;
  objectClarity: number;
  characterConsistency: number;
  iconReadability: number;
  darkBackgroundFit: number;
  remotionCompatibility: number;
};

const limits: Record<keyof StyleScoreInput, number> = {
  styleConsistency: 20,
  semanticAccuracy: 20,
  objectClarity: 15,
  characterConsistency: 10,
  iconReadability: 10,
  darkBackgroundFit: 10,
  remotionCompatibility: 15,
};

export function calculateStyleScore(input: StyleScoreInput): number {
  for (const [dimension, maximum] of Object.entries(limits) as [keyof StyleScoreInput, number][]) {
    const score = input[dimension];
    if (!Number.isFinite(score) || score < 0 || score > maximum) {
      throw new Error(`Invalid editorial score for ${dimension}.`);
    }
  }
  return Object.values(input).reduce((sum, score) => sum + score, 0);
}

export type LegacyStyleScoreInput = {
  styleConsistency: number;
  objectClarity: number;
  characterConsistency: number;
  sceneCompatibility: number;
  iconReadability: number;
  darkBackgroundFit: number;
  remotionCompatibility: number;
};

export function calculateLegacyStyleScore(input: LegacyStyleScoreInput): number {
  const legacyLimits: Record<keyof LegacyStyleScoreInput, number> = {
    styleConsistency: 25, objectClarity: 15, characterConsistency: 10,
    sceneCompatibility: 10, iconReadability: 10, darkBackgroundFit: 15,
    remotionCompatibility: 15,
  };
  for (const [dimension, maximum] of Object.entries(legacyLimits) as [keyof LegacyStyleScoreInput, number][]) {
    const score = input[dimension];
    if (!Number.isFinite(score) || score < 0 || score > maximum) throw new Error(`Invalid editorial score for ${dimension}.`);
  }
  return Object.values(input).reduce((sum, score) => sum + score, 0);
}

export function createPendingStyleReport(warnings: string[]) {
  return RecraftStyleValidationReportSchema.parse({
    profileVersion: 'recraft-v1',
    profileName: 'Selected Editorial Scientific Style',
    provider: 'recraft',
    apiSmokePassed: false,
    assetCount: 0,
    characterConsistency: null,
    objectConsistency: null,
    sceneConsistency: null,
    iconConsistency: null,
    darkBackgroundCompatibility: null,
    remotionCompatibility: null,
    embeddedTextRisk: 'not-reviewed',
    scoreBreakdown: {
      styleConsistency: null,
      objectClarity: null,
      characterConsistency: null,
      sceneCompatibility: null,
      iconReadability: null,
      darkBackgroundFit: null,
      remotionCompatibility: null,
    },
    overallScore: null,
    status: 'blocked',
    humanApproval: 'required',
    humanApprovalStatus: 'pending',
    warnings,
    styleLocked: false,
  });
}

export function styleLockEligible(
  score: number,
  apiSmokePassed: boolean,
  assetCount: number,
  humanApproved: boolean,
  criticalSemanticFailureCount = 0,
  styleConfigured = true,
): boolean {
  return apiSmokePassed && assetCount === 6 && score >= 80 && criticalSemanticFailureCount === 0 && humanApproved && styleConfigured;
}
