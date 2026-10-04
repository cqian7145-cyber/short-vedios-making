import type {Episode, EpisodeScene} from '../episode/schema';
import {visualCapabilities} from '../visual/visualCapabilities';
import type {VisualArchetype, VisualLayoutVariantSchema, VisualPlan} from '../visual/schemas';
import type {z} from 'zod';

export type VisualLayoutVariant = z.infer<typeof VisualLayoutVariantSchema>;
export type VisualRendererVariant = 'network-stage' | 'agent-relationship' | 'mini-chart' | 'probability-bar' | 'timeline' | 'diagram-geometry' | 'flow-path' | 'scale-comparison';
export type VisualAssetStrategy = 'procedural' | 'external_candidate';
export type ResolvedVisualStrategy = {
  sceneId: string;
  requestedArchetype: VisualArchetype;
  resolvedArchetype: VisualArchetype;
  rendererVariant: VisualRendererVariant;
  layoutVariant: VisualLayoutVariant;
  requiredCapabilities: readonly string[];
  fallbackReason?: string;
  assetStrategy: VisualAssetStrategy;
  timelineEvents?: readonly {year: string; label: string}[];
};
export type RenderStrategyResult = {strategies: Record<string, ResolvedVisualStrategy>; visualFallbacks: string[]};

const titleForScene = (scene: EpisodeScene): string => {
  const content = scene.content;
  if ('headline' in content) return content.headline.replace(/\s+/g, ' ').slice(0, 36);
  if ('title' in content) return content.title.slice(0, 36);
  if ('concept' in content) return content.concept.slice(0, 36);
  if ('principle' in content) return content.principle.slice(0, 36);
  if ('metricLabel' in content) return content.metricLabel.slice(0, 36);
  if ('name' in content) return content.name.slice(0, 36);
  return scene.id;
};

const hasPercentValues = (scene: EpisodeScene): boolean => scene.type === 'comparison'
  && scene.content.unit.trim() === '%'
  && [scene.content.before, scene.content.after].every((value) => value >= 0 && value <= 100);

const hasNumericSeries = (scene: EpisodeScene): boolean => scene.type === 'comparison'
  || (scene.type === 'simulation' && (scene.content.mode === 'bidding' || scene.content.mode === 'networkFlow'));

const chooseRenderer = (archetype: VisualArchetype, scene: EpisodeScene): {variant: VisualRendererVariant; fallbackReason?: string} => {
  switch (archetype) {
    case 'network': return {variant: 'network-stage'};
    case 'agents': return {variant: 'agent-relationship'};
    case 'data_curve': return hasNumericSeries(scene) ? {variant: 'mini-chart'} : {variant: 'network-stage', fallbackReason: 'No episode measurements are available for a data curve.'};
    case 'probability': return hasPercentValues(scene) ? {variant: 'probability-bar'} : {variant: 'diagram-geometry', fallbackReason: 'No explicit percentage values are available for a probability bar.'};
    case 'timeline_archive': return {variant: 'timeline'};
    case 'geometric': return {variant: 'diagram-geometry'};
    case 'process_flow': return {variant: 'flow-path'};
    case 'scale_comparison': return scene.type === 'comparison' ? {variant: 'scale-comparison'} : {variant: 'network-stage', fallbackReason: 'No before/after measurements are available for scale comparison.'};
    case 'physical_system': return {variant: 'network-stage'};
    case 'object_world': return {variant: 'agent-relationship'};
    case 'field_wave': return {variant: 'diagram-geometry'};
    case 'spatial_map': return {variant: 'network-stage'};
  }
};

export function resolveRenderStrategies(episode: Episode, plan: VisualPlan): RenderStrategyResult {
  const fallbacks: string[] = [];
  const strategies: Record<string, ResolvedVisualStrategy> = {};
  const timelineEvents = episode.scenes.map((scene, index) => ({year: String(index + 1).padStart(2, '0'), label: titleForScene(scene)}));

  for (const planScene of plan.scenePlans) {
    const episodeScene = episode.scenes.find((scene) => scene.id === planScene.sceneId);
    if (!episodeScene) throw new Error(`Cannot resolve render strategy for unknown scene ${planScene.sceneId}.`);
    const requested = planScene.primaryArchetype;
    let resolved = requested;
    let fallbackReason: string | undefined;
    const requestedStatus = visualCapabilities[requested].status;
    if (requestedStatus !== 'supported') {
      const preferredFallback = planScene.fallbackArchetype ?? visualCapabilities[requested].fallback;
      resolved = visualCapabilities[preferredFallback].status === 'unsupported' ? visualCapabilities[requested].fallback : preferredFallback;
      fallbackReason = `The ${requested} archetype is ${requestedStatus}.`;
    }
    let renderer = chooseRenderer(resolved, episodeScene);
    if (renderer.fallbackReason) {
      const plannedFallback = planScene.fallbackArchetype ?? visualCapabilities[resolved].fallback;
      const safeFallback = visualCapabilities[plannedFallback].status === 'supported' ? plannedFallback : 'network';
      const secondChoice = chooseRenderer(safeFallback, episodeScene);
      if (!secondChoice.fallbackReason) {
        fallbackReason = [fallbackReason, renderer.fallbackReason].filter(Boolean).join(' ');
        resolved = safeFallback;
        renderer = secondChoice;
      } else {
        fallbackReason = [fallbackReason, renderer.fallbackReason].filter(Boolean).join(' ');
        resolved = 'network';
        renderer = {variant: 'network-stage'};
      }
    }
    if (resolved !== requested || fallbackReason) fallbacks.push(`${planScene.sceneId}: ${requested} → ${resolved}${fallbackReason ? ` (${fallbackReason})` : ''}`);
    strategies[planScene.sceneId] = {
      sceneId: planScene.sceneId,
      requestedArchetype: requested,
      resolvedArchetype: resolved,
      rendererVariant: renderer.variant,
      layoutVariant: planScene.layoutVariant,
      requiredCapabilities: planScene.requiredCapabilities,
      fallbackReason,
      assetStrategy: plan.preferredExternalAsset === 'canva_candidate' ? 'external_candidate' : 'procedural',
      ...(renderer.variant === 'timeline' ? {timelineEvents} : {}),
    };
  }
  return {strategies, visualFallbacks: fallbacks};
}
