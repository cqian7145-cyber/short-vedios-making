import type {Episode} from '../episode/schema';
import {VisualDiversityReportSchema, VisualPlanSchema, type VisualDiversityReport, type VisualPlan} from './schemas';
import {visualCapabilities} from './visualCapabilities';

const genericSignature = /(node|network).{0,30}(glow|brighten|pulse)|glow.{0,30}(node|network)/i;

export function auditVisualPlan(planInput: VisualPlan, episode: Episode): VisualDiversityReport {
  const plan = VisualPlanSchema.parse(planInput);
  const scenes = episode.scenes;
  const plans = plan.scenePlans;
  const archetypes = [...new Set(plans.map((scene) => scene.primaryArchetype))];
  let longestRepeatedRun = 0;
  let runStart = 0;
  for (let index = 0; index < plans.length; index += 1) {
    if (index === 0 || plans[index].primaryArchetype !== plans[index - 1].primaryArchetype) runStart = index;
    longestRepeatedRun = Math.max(longestRepeatedRun, index - runStart + 1);
  }
  const networkSceneRatio = plans.length ? plans.filter((scene) => scene.primaryArchetype === 'network').length / plans.length : 0;
  const textDominantSceneRatio = plans.length ? plans.filter((scene) => scene.textDominant).length / plans.length : 0;
  const signatureMomentPresent = plan.signatureMoment.trim().length >= 24 && !genericSignature.test(plan.signatureMoment);
  const duration = scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
  const warnings: string[] = [];

  if (plans.length !== scenes.length || scenes.some((scene, index) => plans[index]?.sceneId !== scene.id)) warnings.push('VisualPlan sceneIds must match Episode scene order exactly.');
  if (duration >= 60 && archetypes.length < 3) warnings.push(`Episodes at least 60 seconds should use 3+ primary archetypes; found ${archetypes.length}.`);
  if (duration >= 120 && (archetypes.length < 4 || archetypes.length > 6)) warnings.push(`Around 150 seconds, target 4–6 primary archetypes; found ${archetypes.length}.`);
  if (longestRepeatedRun > 2) {
    const repeatedRunsHaveReason = plans.every((scene, index) => {
      const sameAsPrevious = index > 0 && scene.primaryArchetype === plans[index - 1].primaryArchetype;
      return !sameAsPrevious || scene.continuityFromPrevious.trim().length >= 20;
    });
    if (!repeatedRunsHaveReason) warnings.push('A primary archetype repeats for 3+ consecutive scenes without a clear continuity reason.');
  }
  if (networkSceneRatio > 0.5) warnings.push(`Network scenes exceed half of the plan (${Math.round(networkSceneRatio * 100)}%).`);
  if (textDominantSceneRatio > 0.6) warnings.push(`Text-dominant scenes exceed 60% of the plan (${Math.round(textDominantSceneRatio * 100)}%).`);
  if (!signatureMomentPresent) warnings.push('Add a concept-specific signature moment beyond a generic network/node glow.');

  for (const scene of plans) {
    const primary = visualCapabilities[scene.primaryArchetype];
    if (primary.status === 'limited' && !scene.fallbackArchetype) warnings.push(`${scene.sceneId} uses limited archetype ${scene.primaryArchetype} without a fallback archetype.`);
    if (scene.fallbackArchetype && visualCapabilities[scene.fallbackArchetype].status === 'unsupported') warnings.push(`${scene.sceneId} uses unsupported fallback archetype ${scene.fallbackArchetype}.`);
  }

  let score = Math.min(5, archetypes.length) * 12 + (signatureMomentPresent ? 20 : 0);
  if (archetypes.length < 3) score -= 15;
  if (networkSceneRatio > 0.5) score -= 10;
  if (textDominantSceneRatio > 0.6) score -= 10;
  if (longestRepeatedRun > 2 && warnings.some((warning) => warning.includes('3+ consecutive'))) score -= 15;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return VisualDiversityReportSchema.parse({uniqueArchetypes: archetypes.length, primaryArchetypes: archetypes, longestRepeatedRun, networkSceneRatio, textDominantSceneRatio, signatureMomentPresent, visualDiversityScore: score, warnings});
}
