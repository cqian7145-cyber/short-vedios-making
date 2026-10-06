import type {Episode} from '../episode/schema';
import type {FactPack} from '../research/schemas';
import type {VisualPlan} from '../visual/schemas';
import type {AssetRegistryEntry, AssetSceneProposal, AssetStrategyProposal, AssetPlan, RecraftAssetBrief} from './assetStrategySchema';
import {AssetPlanSchema, AssetStrategyProposalSchema} from './assetStrategySchema';
import {assetBudgetForDuration, episodeDurationSeconds} from './assetBudget';
import {
  ARCHETYPE_STRATEGY_DEFAULTS, isInformationalElement, isProceduralOnlyConcept,
  proceduralElementsFromCapabilities, semanticRiskForSubject,
} from './assetCapabilities';

export type AssetStrategyContext = {
  episode: Episode;
  visualPlan: VisualPlan;
  factPack: FactPack;
  registryAssets?: AssetRegistryEntry[];
  styleStatus: 'locked' | 'missing';
};

type EnforcementMetrics = {
  highRiskAssetCount: number;
  policyOverrideCount: number;
  warnings: string[];
  proceduralOnlyElements: string[];
};

const SUBJECT_CATALOG: Array<{
  pattern: RegExp; assetKind: RecraftAssetBrief['assetKind']; subject: string; reuseKey: string;
  composition: string; viewpoint: string; risk?: RecraftAssetBrief['semanticRisk']; avoidConcepts?: string[];
}> = [
  {pattern: /\bauction\s+paddle\b/i, assetKind: 'symbolic-object', subject: 'A single auction bidder paddle, a flat bidding card attached to one short straight handle.', reuseKey: 'auction-paddle-v1', composition: 'One isolated front-facing object with no text or marks.', viewpoint: 'Front-facing', risk: 'high', avoidConcepts: ['tennis racket', 'ping-pong paddle', 'magnifying glass', 'balance scale']},
  {pattern: /\b(steam\s+engine|locomotive|steam\s+locomotive)\b/i, assetKind: 'machine', subject: 'A nineteenth-century steam locomotive with a boiler, smokestack, cab, and driving wheels.', reuseKey: 'steam-engine-v1', composition: 'One complete isolated machine.', viewpoint: 'Three-quarter side view'},
  {pattern: /\b(factory|industrial\s+building)\b/i, assetKind: 'industrial-object', subject: 'One simplified factory building with visible industrial structure.', reuseKey: 'factory-v1', composition: 'One isolated building, not a complete scene.', viewpoint: 'Three-quarter view'},
  {pattern: /\b(car|vehicle|automobile)\b/i, assetKind: 'vehicle', subject: 'One clear, ordinary passenger car.', reuseKey: 'car-v1', composition: 'One complete isolated vehicle.', viewpoint: 'Three-quarter side view'},
  {pattern: /\b(doorway|doorways|door|doors|corridor)\b/i, assetKind: 'architecture', subject: 'One simple architectural door in its frame.', reuseKey: 'choice-door-v1', composition: 'One isolated door motif, no corridor or extra doors.', viewpoint: 'Straight-on view'},
  {pattern: /\b(walker|chooser|person|character|human)\b/i, assetKind: 'character', subject: 'One simplified person standing in a neutral pose.', reuseKey: 'choice-person-v1', composition: 'One full figure with a clear silhouette, isolated.', viewpoint: 'Front-facing'},
  {pattern: /\b(gear|machine\s+part)\b/i, assetKind: 'machine', subject: 'One simple mechanical gear component.', reuseKey: 'gear-v1', composition: 'One isolated mechanical component.', viewpoint: 'Three-quarter view'},
];

function proceduralCategoryForScene(sceneText: string, archetype: string): string {
  if (/\bbranch(?:ing)?\b/i.test(sceneText)) return 'branching-diagram';
  if (/\b(formula|equation)\b/i.test(sceneText)) return 'formula';
  if (/\b(chart|graph|data curve)\b/i.test(sceneText)) return 'chart';
  if (/\btimeline\b/i.test(sceneText)) return 'timeline';
  if (/\b(probability)\b/i.test(sceneText)) return 'probability-visual';
  return archetype === 'network' ? 'network-diagram' : `${archetype}-visual`;
}

function unique<T>(items: T[]): T[] { return [...new Set(items)]; }
function assetIdFromReuseKey(reuseKey: string): string { return reuseKey; }

export function inferPhysicalAssets(sceneText: string): RecraftAssetBrief[] {
  const found = SUBJECT_CATALOG.filter((entry) => entry.pattern.test(sceneText));
  return found.map((entry) => ({
    assetId: assetIdFromReuseKey(entry.reuseKey), assetKind: entry.assetKind,
    subject: entry.subject, composition: entry.composition, viewpoint: entry.viewpoint,
    isolation: 'isolated', reuseKey: entry.reuseKey,
    semanticRisk: entry.risk ?? 'low', avoidConcepts: entry.avoidConcepts ?? [],
  }));
}

function sceneInputText(context: AssetStrategyContext, sceneId: string): string {
  const episodeScene = context.episode.scenes.find((scene) => scene.id === sceneId);
  const visualScene = context.visualPlan.scenePlans.find((scene) => scene.sceneId === sceneId);
  if (!episodeScene || !visualScene) return '';
  const contentText = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(contentText);
    if (value && typeof value === 'object') return Object.values(value).flatMap(contentText);
    return [];
  };
  return [
    episodeScene.type, episodeScene.intent?.focus ?? '', ...contentText(episodeScene.content),
    visualScene.primaryArchetype, visualScene.secondaryArchetype ?? '', visualScene.visualSubject,
    visualScene.motionIdea, visualScene.spatialLayout, visualScene.continuityFromPrevious,
  ].join(' ');
}

function hasInformationalContent(elements: string[], text: string): boolean {
  return elements.some(isInformationalElement)
    || /\b(chart|graph|formula|equation|arrow|network|comparison|data|metric|counter|timeline|probability|branch(?:ing)?|relationships?)\b/i.test(text);
}

export function createHeuristicAssetProposal(context: AssetStrategyContext): AssetStrategyProposal {
  return AssetStrategyProposalSchema.parse({
    scenePlans: context.episode.scenes.map((scene) => {
      const visualScene = context.visualPlan.scenePlans.find((entry) => entry.sceneId === scene.id)!;
      const text = sceneInputText(context, scene.id);
      const assets = inferPhysicalAssets(text);
      const elements = proceduralElementsFromCapabilities(visualScene.requiredCapabilities);
      const archetypeDefault = ARCHETYPE_STRATEGY_DEFAULTS[visualScene.primaryArchetype];
      const info = hasInformationalContent(elements, text);
      const strategy = assets.length
        ? info || archetypeDefault === 'procedural' ? 'hybrid' : archetypeDefault
        : 'procedural';
      return {
        sceneId: scene.id,
        strategy,
        reason: assets.length
          ? info ? 'Illustrated physical subject pairs with precise information elements.' : 'Atomic physical subject is suitable for Recraft illustration.'
          : `The ${visualScene.primaryArchetype} visual is best constructed with deterministic Remotion/SVG primitives.`,
        recraftAssets: assets.map(({source: _source, ...asset}) => asset),
        proceduralElements: elements,
        fallback: 'procedural',
      };
    }),
  });
}

export function enforceLocalAssetPolicy(
  candidate: unknown,
  context: AssetStrategyContext,
): {plan: AssetPlan; metrics: EnforcementMetrics} {
  const proposal = AssetStrategyProposalSchema.parse(candidate);
  if (proposal.scenePlans.length !== context.episode.scenes.length) throw new Error('AssetPlan must include exactly one proposal for each Episode scene.');
  const registryByReuseKey = new Map((context.registryAssets ?? []).map((asset) => [asset.reuseKey, asset]));
  const seenInEpisode = new Map<string, {asset: RecraftAssetBrief; sceneIds: string[]} >();
  const metrics: EnforcementMetrics = {highRiskAssetCount: 0, policyOverrideCount: 0, warnings: [], proceduralOnlyElements: []};
  const scenePlans = proposal.scenePlans.map((sceneProposal, index) => {
    const expectedScene = context.episode.scenes[index];
    const visualScene = context.visualPlan.scenePlans.find((entry) => entry.sceneId === expectedScene.id);
    if (sceneProposal.sceneId !== expectedScene.id || !visualScene) throw new Error(`AssetPlan scene order mismatch at ${index}; expected ${expectedScene.id}.`);
    const text = sceneInputText(context, expectedScene.id);
    const forcedDiagram = expectedScene.type === 'diagram'
      && ['network', 'geometric', 'probability', 'data_curve', 'process_flow'].includes(visualScene.primaryArchetype);
    const forcedPreciseVisual = isProceduralOnlyConcept(visualScene.visualSubject)
      && ['network', 'geometric', 'probability', 'data_curve', 'process_flow', 'field_wave'].includes(visualScene.primaryArchetype);
    const forceWholeSceneProcedural = forcedDiagram || forcedPreciseVisual;
    if (forceWholeSceneProcedural) metrics.proceduralOnlyElements.push(proceduralCategoryForScene(text, visualScene.primaryArchetype));
    const proceduralElements = unique([
      ...sceneProposal.proceduralElements,
      ...proceduralElementsFromCapabilities(visualScene.requiredCapabilities),
    ]);
    const retained: RecraftAssetBrief[] = [];
    const overrideReasons: string[] = [];
    const sceneReuseKeys = new Set<string>();
    let forcedProcedural = false;

    for (const proposedAsset of sceneProposal.recraftAssets) {
      if (forceWholeSceneProcedural) {
        proceduralElements.push(proposedAsset.reuseKey);
        overrideReasons.push('Precise diagram and information graphics are procedural-only.');
        forcedProcedural = true;
        continue;
      }
      const semanticRisk = semanticRiskForSubject(proposedAsset.subject, proposedAsset.semanticRisk);
      if (semanticRisk === 'high') {
        metrics.highRiskAssetCount += 1;
        metrics.warnings.push('High semantic ambiguity; procedural fallback preferred.');
        metrics.proceduralOnlyElements.push(proposedAsset.reuseKey);
        proceduralElements.push(proposedAsset.reuseKey);
        overrideReasons.push(`High-risk subject ${proposedAsset.reuseKey} is routed to procedural/curated fallback.`);
        forcedProcedural = true;
        continue;
      }
      if (proposedAsset.isolation === 'scene-plate') {
        overrideReasons.push('Atomic asset policy rejected a full-scene Recraft plate.');
        proceduralElements.push(proposedAsset.reuseKey);
        forcedProcedural = true;
        continue;
      }
      if (isProceduralOnlyConcept(proposedAsset.subject)) {
        overrideReasons.push(`Procedural-only visual ${proposedAsset.subject} cannot be assigned to Recraft.`);
        proceduralElements.push(proposedAsset.reuseKey);
        metrics.proceduralOnlyElements.push(proposedAsset.reuseKey);
        forcedProcedural = true;
        continue;
      }
      if (sceneReuseKeys.has(proposedAsset.reuseKey)) {
        overrideReasons.push(`Duplicate reuseKey ${proposedAsset.reuseKey} was collapsed to one atomic asset in this scene.`);
        continue;
      }
      sceneReuseKeys.add(proposedAsset.reuseKey);
      const registered = registryByReuseKey.get(proposedAsset.reuseKey);
      const previous = seenInEpisode.get(proposedAsset.reuseKey);
      const source: 'registry' | 'episode' | 'new' = registered ? 'registry' : previous ? 'episode' : 'new';
      const asset = {...proposedAsset, semanticRisk, source};
      retained.push(asset);
      if (previous && !previous.sceneIds.includes(expectedScene.id)) previous.sceneIds.push(expectedScene.id);
      else seenInEpisode.set(asset.reuseKey, {asset, sceneIds: [expectedScene.id]});
      if (previous && sceneProposal.strategy === 'recraft') {
        overrideReasons.push(`Duplicate reuseKey ${asset.reuseKey} is reused instead of regenerated.`);
      }
    }

    const hasNewAsset = retained.some((asset) => asset.source === 'new');
    const hasInformational = hasInformationalContent(proceduralElements, text);
    let strategy: 'procedural' | 'recraft' | 'hybrid' | 'reuse';
    if (forcedProcedural && retained.length === 0) strategy = 'procedural';
    else if (retained.length === 0) strategy = 'procedural';
    else if (hasNewAsset) strategy = hasInformational || sceneProposal.strategy === 'hybrid' ? 'hybrid' : 'recraft';
    else strategy = hasInformational ? 'hybrid' : 'reuse';

    const proceduralOnlyScene = !retained.length && (
      ['network', 'probability', 'data_curve', 'geometric', 'process_flow', 'field_wave'].includes(visualScene.primaryArchetype)
      || isProceduralOnlyConcept(text)
    );
    if (!forceWholeSceneProcedural && proceduralOnlyScene && sceneProposal.strategy !== 'procedural') {
      overrideReasons.push('Precise diagrams and information graphics are procedural-only.');
      strategy = 'procedural';
    }
    if (retained.some((asset) => asset.source !== 'new') && sceneProposal.strategy === 'recraft') {
      overrideReasons.push('An existing matching asset is reused instead of generating a duplicate.');
    }
    if (overrideReasons.length) metrics.policyOverrideCount += 1;

    return {
      sceneId: expectedScene.id,
      strategy,
      reason: overrideReasons.length ? `Local policy enforced: ${unique(overrideReasons).join(' ')}` : sceneProposal.reason,
      recraftAssets: retained,
      proceduralElements: unique(proceduralElements),
      fallback: sceneProposal.fallback,
      requiresNewAsset: hasNewAsset,
      ...(overrideReasons.length ? {overrideReason: unique(overrideReasons).join(' ')} : {}),
    };
  });

  const uniqueRecraftAssets = [...seenInEpisode.values()]
    .filter(({asset}) => asset.source === 'new')
    .map(({asset}) => asset);
  const duration = episodeDurationSeconds(context.episode);
  const tier = assetBudgetForDuration(duration);
  const budget = {
    episodeDurationSeconds: duration,
    ...tier,
    uniqueNewAssetCount: uniqueRecraftAssets.length,
    utilization: uniqueRecraftAssets.length / tier.hardMax,
  };
  const reuseGroups = [...seenInEpisode.entries()]
    .filter(([, group]) => group.sceneIds.length > 1 || group.asset.source === 'registry')
    .map(([reuseKey, group]) => ({reuseKey, assetId: group.asset.assetId, sceneIds: group.sceneIds, source: group.asset.source === 'registry' ? 'registry' as const : 'new' as const}));
  const planWarnings = unique(metrics.warnings);
  metrics.proceduralOnlyElements = unique([
    ...metrics.proceduralOnlyElements,
    ...scenePlans.flatMap((scene) => scene.proceduralElements.filter(isProceduralOnlyConcept)),
  ]);
  const plan = AssetPlanSchema.parse({
    episodeId: context.episode.id,
    profileVersion: 'recraft-v1',
    styleStatus: context.styleStatus,
    budget,
    scenePlans,
    uniqueRecraftAssets,
    reuseGroups,
    warnings: planWarnings,
  });
  metrics.proceduralOnlyElements = unique(metrics.proceduralOnlyElements);
  return {plan, metrics};
}
