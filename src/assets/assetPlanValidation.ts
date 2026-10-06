import type {Episode} from '../episode/schema';
import type {AssetPlan, AssetStrategyReport} from './assetStrategySchema';
import {AssetPlanSchema, AssetStrategyReportSchema} from './assetStrategySchema';
import {assetBudgetForDuration, episodeDurationSeconds} from './assetBudget';
import {isProceduralOnlyConcept, semanticRiskForSubject} from './assetCapabilities';

export type AssetPlanValidationResult = {
  valid: boolean;
  errors: string[];
  report: AssetStrategyReport;
};

function failedReport(episode: Episode, warnings: string[], errors: string[]): AssetStrategyReport {
  const budget = assetBudgetForDuration(episodeDurationSeconds(episode));
  return AssetStrategyReportSchema.parse({
    episodeId: episode.id, sceneCount: episode.scenes.length,
    strategyCounts: {procedural: 0, recraft: 0, hybrid: 0, reuse: 0},
    uniqueRecraftAssetCount: 0,
    recraftBudget: budget,
    budgetUtilization: 0,
    highRiskAssetCount: 0,
    policyOverrideCount: 0,
    reuseCount: 0,
    proceduralOnlyElements: [],
    recraftSceneRatio: 0,
    warnings: [...warnings, ...errors],
    status: 'fail',
  });
}

export function validateAssetPlan(input: unknown, episode: Episode, policyMetrics?: {
  highRiskAssetCount?: number; policyOverrideCount?: number; proceduralOnlyElements?: string[]; warnings?: string[];
}): AssetPlanValidationResult {
  const parsed = AssetPlanSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`);
    return {valid: false, errors, report: failedReport(episode, policyMetrics?.warnings ?? [], errors)};
  }
  const plan: AssetPlan = parsed.data;
  const errors: string[] = [];
  const warnings = [...(policyMetrics?.warnings ?? []), ...plan.warnings];
  const expectedSceneIds = episode.scenes.map((scene) => scene.id);
  if (plan.episodeId !== episode.id) errors.push(`episodeId must match ${episode.id}.`);
  if (plan.scenePlans.length !== expectedSceneIds.length) errors.push('Every Episode scene must have exactly one asset strategy.');
  expectedSceneIds.forEach((id, index) => {
    if (plan.scenePlans[index]?.sceneId !== id) errors.push(`scenePlans[${index}] must match Episode scene ${id} in order.`);
  });

  for (const scene of plan.scenePlans) {
    for (const asset of scene.recraftAssets) {
      if (isProceduralOnlyConcept(asset.subject)) errors.push(`${scene.sceneId}: procedural-only concept was assigned to Recraft.`);
      if (semanticRiskForSubject(asset.subject, asset.semanticRisk) === 'high') errors.push(`${scene.sceneId}: high-risk asset remained assigned to Recraft.`);
      if (asset.isolation === 'scene-plate') errors.push(`${scene.sceneId}: full-scene Recraft plates are not permitted by the atomic-first policy.`);
    }
    if (scene.requiresNewAsset !== scene.recraftAssets.some((asset) => asset.source === 'new')) {
      errors.push(`${scene.sceneId}: requiresNewAsset does not match its asset sources.`);
    }
  }

  const duration = episodeDurationSeconds(episode);
  const tier = assetBudgetForDuration(duration);
  if (Math.abs(plan.budget.episodeDurationSeconds - duration) > 1 / episode.fps) errors.push('AssetPlan duration must match the normalized Episode timeline.');
  if (plan.budget.recommendedMin !== tier.recommendedMin || plan.budget.recommendedMax !== tier.recommendedMax || plan.budget.hardMax !== tier.hardMax) {
    errors.push('AssetPlan budget limits must match the local duration policy.');
  }
  const sceneNewAssets = plan.scenePlans.flatMap((scene) => scene.recraftAssets.filter((asset) => asset.source === 'new'));
  const expectedNewKeys = new Set(sceneNewAssets.map((asset) => asset.reuseKey));
  if (sceneNewAssets.length !== expectedNewKeys.size) errors.push('A reuseKey may be newly generated only once; later scenes must reuse it.');
  if (plan.uniqueRecraftAssets.some((asset) => asset.source !== 'new')) errors.push('uniqueRecraftAssets must contain only newly generated assets.');
  const listedNewAssets = plan.uniqueRecraftAssets.filter((asset) => asset.source === 'new');
  const listedNewKeys = new Set(listedNewAssets.map((asset) => asset.reuseKey));
  if (expectedNewKeys.size !== listedNewKeys.size || [...expectedNewKeys].some((key) => !listedNewKeys.has(key))) {
    errors.push('uniqueRecraftAssets must exactly reflect new assets referenced by scene plans.');
  }
  if (plan.budget.uniqueNewAssetCount !== expectedNewKeys.size) errors.push('Budget count must count unique new Recraft assets only.');
  if (new Set(listedNewAssets.map((asset) => asset.reuseKey)).size !== listedNewAssets.length) errors.push('Duplicate reuse keys must count once in the Recraft budget.');
  if (plan.budget.utilization !== expectedNewKeys.size / tier.hardMax) errors.push('Budget utilization must match the unique asset count and local hard maximum.');
  if (expectedNewKeys.size > tier.hardMax) errors.push(`Unique Recraft asset budget exceeded: ${expectedNewKeys.size}/${tier.hardMax}.`);

  const counts = {procedural: 0, recraft: 0, hybrid: 0, reuse: 0};
  for (const scene of plan.scenePlans) counts[scene.strategy] += 1;
  const recraftSceneRatio = plan.scenePlans.length ? (counts.recraft + counts.hybrid) / plan.scenePlans.length : 0;
  const uniqueRecraftAssetCount = expectedNewKeys.size;
  const highRiskAssetCount = policyMetrics?.highRiskAssetCount ?? 0;
  const policyOverrideCount = policyMetrics?.policyOverrideCount ?? plan.scenePlans.filter((scene) => scene.overrideReason).length;
  const reuseCount = plan.scenePlans.reduce((count, scene) => count + scene.recraftAssets.filter((asset) => asset.source === 'episode' || asset.source === 'registry').length, 0);
  const proceduralOnlyElements = [...new Set(policyMetrics?.proceduralOnlyElements ?? plan.scenePlans.flatMap((scene) => scene.proceduralElements.filter(isProceduralOnlyConcept)))];

  if (highRiskAssetCount > 0) warnings.push('High semantic ambiguity; procedural fallback preferred.');
  if (reuseCount === 0 && plan.scenePlans.some((scene) => scene.recraftAssets.some((asset) => asset.source === 'episode'))) warnings.push('A reuse opportunity was found but not reflected in a reuse scene strategy.');
  if (recraftSceneRatio > 0.7) warnings.push(`Recraft is involved in ${Math.round(recraftSceneRatio * 100)}% of scenes; keep the video diagram-driven.`);
  if (duration >= 60 && counts.procedural === 0) warnings.push('Episode has no fully procedural scenes despite a duration of at least 60 seconds.');
  if (recraftSceneRatio === 1 && plan.scenePlans.length > 0) errors.push('Every scene is Recraft-involved; 100% Recraft coverage is not allowed.');

  const report = AssetStrategyReportSchema.parse({
    episodeId: episode.id,
    sceneCount: plan.scenePlans.length,
    strategyCounts: counts,
    uniqueRecraftAssetCount,
    recraftBudget: tier,
    budgetUtilization: uniqueRecraftAssetCount / tier.hardMax,
    highRiskAssetCount,
    policyOverrideCount,
    reuseCount,
    proceduralOnlyElements,
    recraftSceneRatio,
    warnings: [...new Set(warnings)],
    status: errors.length ? 'fail' : warnings.length ? 'warning' : 'pass',
  });
  return {valid: errors.length === 0, errors, report};
}
