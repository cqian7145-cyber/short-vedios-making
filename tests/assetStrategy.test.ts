import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {EpisodeSchema, type Episode} from '../src/episode/schema';
import {FactPackSchema, type FactPack} from '../src/research/schemas';
import {VisualPlanSchema, type VisualPlan} from '../src/visual/schemas';
import {createAssetStrategyPlan, MAX_ASSET_PLAN_REPAIR_ATTEMPTS} from '../src/assets/assetStrategyDirector';
import {createHeuristicAssetProposal, enforceLocalAssetPolicy} from '../src/assets/assetStrategyPolicy';
import {AssetStrategyProposalSchema, AssetPlanSchema, AssetRegistrySchema, type AssetSceneProposal} from '../src/assets/assetStrategySchema';
import {validateAssetPlan} from '../src/assets/assetPlanValidation';
import {loadAssetRegistry} from '../src/assets/assetRegistry';
import type {LLMProvider, StructuredGenerationRequest} from '../src/ai/provider';

type SceneSpec = {id: string; visual: string; archetype?: VisualPlan['scenePlans'][number]['primaryArchetype']; capabilities?: string[]; type?: Episode['scenes'][number]['type']; duration?: number};

function makeInputs(specs: SceneSpec[], episodeId = 'asset-plan-test') {
  const episode = EpisodeSchema.parse({
    schemaVersion: 1, id: episodeId, title: 'Test episode', fps: 30, width: 1920, height: 1080,
    scenes: specs.map((spec) => ({
      id: spec.id, type: spec.type ?? 'ending', durationSeconds: spec.duration ?? 10,
      transition: {overlapSeconds: 0},
      content: spec.type === 'diagram'
        ? {networkId: 'test-network', eyebrow: 'Test diagram', title: spec.visual, footnote: 'Procedural detail.', annotations: []}
        : {concept: spec.visual, summary: 'A test summary', brand: 'Vibe Knowledge'},
    })),
    networks: specs.some((spec) => spec.type === 'diagram') ? {
      'test-network': {id: 'test-network', nodes: [{id: 'node-a', label: 'A', x: 0, y: 0}], edges: [], routes: []},
    } : {},
  });
  const visualPlan = VisualPlanSchema.parse({
    episodeArchetype: 'object_world', persistentMotif: 'A repeated test motif', signatureMoment: 'A clear test moment',
    scenePlans: specs.map((spec) => ({
      sceneId: spec.id, primaryArchetype: spec.archetype ?? 'object_world',
      visualSubject: spec.visual, motionIdea: 'The subject moves slowly.', cameraIntent: 'locked',
      spatialLayout: 'An isolated subject with generous empty space.', continuityFromPrevious: '',
      reuseExistingPrimitive: 'Reuse an existing primitive if available.', requiredCapabilities: spec.capabilities ?? [],
      layoutVariant: 'center-stage', textDominant: false,
    })),
  });
  const factPack = FactPackSchema.parse({
    topic: 'Test topic', summary: 'A verified test context.', verifiedClaims: [], uncertainClaims: [],
    contradictedClaims: [], safeConceptualClaims: ['Keep facts unchanged.'], sources: [], publicationReady: true,
  });
  return {episode, visualPlan, factPack, styleStatus: 'missing' as const};
}

function sceneProposal(sceneId: string, strategy: AssetSceneProposal['strategy'], recraftAssets: AssetSceneProposal['recraftAssets'] = [], proceduralElements: string[] = []): AssetSceneProposal {
  return {sceneId, strategy, reason: 'Test proposal.', recraftAssets, proceduralElements, fallback: 'procedural'};
}

function asset(assetId: string, subject = `A single atomic machine ${assetId}`, reuseKey = assetId) {
  return {assetId, assetKind: 'machine' as const, subject, composition: 'One isolated object.', viewpoint: 'Three-quarter view', isolation: 'isolated' as const, reuseKey, semanticRisk: 'low' as const, avoidConcepts: []};
}

test('network and precise diagram scenes route to procedural Remotion elements', () => {
  const input = makeInputs([{id: 'network-scene', visual: 'A precise network diagram showing relationships between nodes.', archetype: 'network', capabilities: ['network-stage', 'node', 'edge', 'flow-particles'], type: 'diagram'}]);
  const proposal = createHeuristicAssetProposal(input);
  const {plan} = enforceLocalAssetPolicy(proposal, input);
  assert.equal(plan.scenePlans[0].strategy, 'procedural');
  assert.equal(plan.scenePlans[0].recraftAssets.length, 0);
  assert.ok(plan.scenePlans[0].proceduralElements.includes('network-diagram'));
});

test('machine-only scene can use a new atomic Recraft asset', () => {
  const input = makeInputs([{id: 'engine', visual: 'A nineteenth-century steam engine with visible machinery.', archetype: 'object_world'}]);
  const result = enforceLocalAssetPolicy(createHeuristicAssetProposal(input), input);
  assert.equal(result.plan.scenePlans[0].strategy, 'recraft');
  assert.equal(result.plan.uniqueRecraftAssets[0].reuseKey, 'steam-engine-v1');
  assert.equal(result.plan.budget.uniqueNewAssetCount, 1);
});

test('illustrated machine plus chart becomes hybrid while chart remains procedural', () => {
  const input = makeInputs([{id: 'engine-chart', visual: 'A steam engine beside a data chart showing a measured curve.', archetype: 'object_world', capabilities: ['mini-chart', 'counter']}]);
  const result = enforceLocalAssetPolicy(createHeuristicAssetProposal(input), input);
  assert.equal(result.plan.scenePlans[0].strategy, 'hybrid');
  assert.ok(result.plan.scenePlans[0].recraftAssets.some((entry) => entry.assetKind === 'machine'));
  assert.ok(result.plan.scenePlans[0].proceduralElements.includes('chart'));
});

test('branching-choice diagram is forced procedural even when proposal asks for Recraft', () => {
  const input = makeInputs([{id: 'choice-branch', visual: 'A branching-choice diagram with one input and three paths.', archetype: 'network', type: 'diagram'}]);
  const proposed = AssetStrategyProposalSchema.parse({scenePlans: [sceneProposal('choice-branch', 'recraft', [asset('branch-icon', 'A precise branching-choice diagram', 'choice-branch-v1')])]});
  const result = enforceLocalAssetPolicy(proposed, input);
  assert.equal(result.plan.scenePlans[0].strategy, 'procedural');
  assert.equal(result.plan.scenePlans[0].recraftAssets.length, 0);
  assert.match(result.plan.scenePlans[0].overrideReason ?? '', /procedural-only/i);
  assert.equal(result.metrics.policyOverrideCount, 1);
});

test('auction paddle is marked high risk and never assigned to Recraft by the default policy', () => {
  const input = makeInputs([{id: 'auction', visual: 'An auction paddle held up for a bid.', archetype: 'object_world'}]);
  const result = enforceLocalAssetPolicy(createHeuristicAssetProposal(input), input);
  assert.equal(result.metrics.highRiskAssetCount, 1);
  assert.ok(result.metrics.warnings.includes('High semantic ambiguity; procedural fallback preferred.'));
  assert.ok(result.plan.scenePlans[0].recraftAssets.every((entry) => entry.reuseKey !== 'auction-paddle-v1'));
  assert.ok(result.plan.scenePlans[0].proceduralElements.includes('auction-paddle-v1'));
});

test('duplicate motifs reuse the first episode asset instead of creating another', () => {
  const input = makeInputs([
    {id: 'engine-a', visual: 'One steam engine on a dark stage.'},
    {id: 'engine-b', visual: 'The same steam engine returns, slightly closer.'},
  ]);
  const result = enforceLocalAssetPolicy(createHeuristicAssetProposal(input), input);
  assert.equal(result.plan.scenePlans[0].strategy, 'recraft');
  assert.equal(result.plan.scenePlans[1].strategy, 'reuse');
  assert.equal(result.plan.budget.uniqueNewAssetCount, 1);
  assert.equal(result.plan.reuseGroups[0].sceneIds.length, 2);
});

test('a matching asset registry entry is reused without adding generation budget', () => {
  const input = makeInputs([{id: 'reuse-library', visual: 'One steam engine.'}]);
  const registryAsset = {
    id: 'library-steam-engine', reuseKey: 'steam-engine-v1', assetKind: 'machine' as const,
    subject: 'A nineteenth-century steam locomotive.', profileVersion: 'recraft-v1', provider: 'recraft' as const,
    path: 'assets/library/steam-engine.png',
  };
  const result = enforceLocalAssetPolicy(createHeuristicAssetProposal(input), {...input, registryAssets: [registryAsset]});
  assert.equal(result.plan.scenePlans[0].strategy, 'reuse');
  assert.equal(result.plan.budget.uniqueNewAssetCount, 0);
  assert.equal(result.plan.scenePlans[0].recraftAssets[0].source, 'registry');
});

test('duplicate reuse keys within one scene collapse to one atomic asset', () => {
  const input = makeInputs([{id: 'same-scene', visual: 'A machine'}]);
  const proposed = {scenePlans: [sceneProposal('same-scene', 'recraft', [asset('part-1', 'A mechanical machine part', 'same-key'), asset('part-2', 'The same machine part', 'same-key')])]};
  const result = enforceLocalAssetPolicy(proposed, input);
  assert.equal(result.plan.scenePlans[0].recraftAssets.length, 1);
  assert.equal(result.plan.budget.uniqueNewAssetCount, 1);
  assert.equal(result.metrics.policyOverrideCount, 1);
});

test('registry scanning tolerates absent folders and loads only existing in-workspace assets', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'asset-registry-test-'));
  try {
    const library = path.join(root, 'assets', 'library');
    await mkdir(library, {recursive: true});
    await writeFile(path.join(library, 'steam-engine.png'), 'mock image');
    await writeFile(path.join(library, 'asset-registry.json'), JSON.stringify({
      schemaVersion: 'asset-registry-v1', assets: [{id: 'engine-01', reuseKey: 'steam-engine-v1', assetKind: 'machine', subject: 'A steam engine', profileVersion: 'recraft-v1', provider: 'recraft', path: 'assets/library/steam-engine.png'}],
    }));
    const registry = await loadAssetRegistry(root);
    assert.equal(registry.assets.length, 1);
    assert.equal(registry.assets[0].reuseKey, 'steam-engine-v1');
    assert.deepEqual(registry.warnings, []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test('60-second budget counts unique assets and fails above its hard maximum', () => {
  const subjects = ['steam engine', 'factory', 'car', 'door', 'person', 'gear'];
  const input = makeInputs(subjects.map((subject, index) => ({id: `short-${index}`, visual: `One ${subject}.`, duration: 10})));
  const result = enforceLocalAssetPolicy(createHeuristicAssetProposal(input), input);
  assert.equal(result.plan.budget.hardMax, 5);
  const validation = validateAssetPlan(result.plan, input.episode, result.metrics);
  assert.equal(validation.valid, false);
  assert.equal(validation.report.status, 'fail');
  assert.equal(validation.report.uniqueRecraftAssetCount, 6);
});

test('150-second budget has a hard maximum of eight unique assets', () => {
  const input = makeInputs(Array.from({length: 9}, (_, index) => ({id: `long-${index}`, visual: `A test subject number ${index}.`, duration: index === 0 ? 22 : 16})), 'long-episode');
  const proposals = input.episode.scenes.map((scene, index) => sceneProposal(scene.id, 'recraft', [asset(`unique-machine-${index}`, `A unique factory machine component ${index}`, `machine-component-${index}`)]));
  const result = enforceLocalAssetPolicy({scenePlans: proposals}, input);
  assert.equal(result.plan.budget.episodeDurationSeconds, 150);
  assert.equal(result.plan.budget.hardMax, 8);
  const validation = validateAssetPlan(result.plan, input.episode, result.metrics);
  assert.equal(validation.valid, false);
  assert.equal(validation.report.status, 'fail');
});

test('more than 70 percent Recraft-involved scenes emit a warning', () => {
  const subjects = ['steam engine', 'factory building', 'car', 'door', 'person', 'data chart'];
  const input = makeInputs(subjects.map((subject, index) => ({id: `ratio-${index}`, visual: `A single ${subject}.`, archetype: index < 5 ? 'object_world' : 'data_curve', duration: 11})));
  const result = enforceLocalAssetPolicy(createHeuristicAssetProposal(input), input);
  const validation = validateAssetPlan(result.plan, input.episode, result.metrics);
  assert.ok(validation.report.recraftSceneRatio > 0.7);
  assert.ok(validation.report.warnings.some((warning) => warning.includes('diagram-driven')));
  assert.equal(validation.report.status, 'warning');
});

test('episodes at least 60 seconds warn when every scene lacks a fully procedural route', () => {
  const input = makeInputs([{id: 'long-physical', visual: 'A steam engine.', duration: 70}]);
  const result = enforceLocalAssetPolicy(createHeuristicAssetProposal(input), input);
  const validation = validateAssetPlan(result.plan, input.episode, result.metrics);
  assert.ok(validation.report.warnings.some((warning) => warning.includes('no fully procedural scenes')));
});

test('100 percent Recraft-involved scenes fail the slideshow gate', () => {
  const input = makeInputs([
    {id: 'physical-a', visual: 'A steam engine.'},
    {id: 'physical-b', visual: 'A factory building.'},
    {id: 'physical-c', visual: 'A passenger car.'},
  ]);
  const result = enforceLocalAssetPolicy(createHeuristicAssetProposal(input), input);
  const validation = validateAssetPlan(result.plan, input.episode, result.metrics);
  assert.equal(validation.report.recraftSceneRatio, 1);
  assert.equal(validation.report.status, 'fail');
  assert.ok(validation.errors.some((error) => error.includes('100% Recraft')));
});

test('unknown asset kinds are rejected by the strict proposal schema', () => {
  const input = makeInputs([{id: 'unknown-kind', visual: 'An icon.'}]);
  const invalid = {scenePlans: [sceneProposal('unknown-kind', 'recraft', [{...asset('bad-kind'), assetKind: 'chart'} as never])]};
  assert.equal(AssetStrategyProposalSchema.safeParse(invalid).success, false);
  const validation = validateAssetPlan(invalid, input.episode);
  assert.equal(validation.valid, false);
  assert.equal(validation.report.status, 'fail');
  assert.equal(AssetPlanSchema.safeParse({...invalid, episodeId: input.episode.id, profileVersion: 'recraft-v1', styleStatus: 'missing', budget: {}, uniqueRecraftAssets: [], reuseGroups: [], warnings: []}).success, false);
});

test('asset registry contract accepts Recraft metadata and rejects styling/code fields', () => {
  const valid = {
    schemaVersion: 'asset-registry-v1',
    assets: [{id: 'engine-01', reuseKey: 'steam-engine-v1', assetKind: 'machine', subject: 'A steam engine', profileVersion: 'recraft-v1', provider: 'recraft', path: 'assets/library/steam-engine.png'}],
  };
  assert.equal(AssetRegistrySchema.safeParse(valid).success, true);
  assert.equal(AssetRegistrySchema.safeParse({...valid, styleId: 'private-style'}).success, false);
  assert.equal(AssetRegistrySchema.safeParse({schemaVersion: 'asset-registry-v1', assets: [{...valid.assets[0], subject: 'A machine at 40px'}]}).success, false);
});

test('local policy overrides a model proposal that routes an exact chart to Recraft', () => {
  const input = makeInputs([{id: 'chart', visual: 'A data chart comparing two outcomes.', archetype: 'data_curve'}]);
  const proposed = {scenePlans: [sceneProposal('chart', 'recraft', [asset('bad-chart', 'A data chart', 'chart-v1')])]};
  const result = enforceLocalAssetPolicy(proposed, input);
  assert.equal(result.plan.scenePlans[0].strategy, 'procedural');
  assert.equal(result.plan.scenePlans[0].recraftAssets.length, 0);
  assert.equal(result.metrics.policyOverrideCount, 1);
});

test('AssetPlan structural repair is bounded to one attempt', async () => {
  const input = makeInputs([{id: 'repair', visual: 'A steam engine.'}]);
  const validProposal = createHeuristicAssetProposal(input);
  let calls = 0;
  const provider: LLMProvider = {
    model: 'mock-asset-director',
    generateStructured: async (_request: StructuredGenerationRequest) => {
      calls += 1;
      return {text: calls === 1 ? '{"scenePlans":[]}' : JSON.stringify(validProposal)};
    },
  };
  const result = await createAssetStrategyPlan({...input, provider});
  assert.equal(calls, 2);
  assert.equal(result.repairAttempts, 1);
  assert.equal(MAX_ASSET_PLAN_REPAIR_ATTEMPTS, 1);
  assert.equal(result.planningMode, 'deepseek');
});

test('invalid proposal fails after exactly one bounded repair attempt', async () => {
  const input = makeInputs([{id: 'repair-fails', visual: 'A steam engine.'}]);
  let calls = 0;
  const provider: LLMProvider = {
    model: 'mock-asset-director',
    generateStructured: async () => { calls += 1; return {text: '{"scenePlans":[]}'}; },
  };
  await assert.rejects(() => createAssetStrategyPlan({...input, provider}), /failed after 2 attempts/);
  assert.equal(calls, 2);
  assert.equal(MAX_ASSET_PLAN_REPAIR_ATTEMPTS, 1);
});

test('planning does not mutate Episode or Fact Pack inputs', async () => {
  const input = makeInputs([{id: 'immutable', visual: 'A steam engine and its data chart.', capabilities: ['mini-chart']}]);
  const episodeBefore = structuredClone(input.episode);
  const factsBefore = structuredClone(input.factPack);
  await createAssetStrategyPlan(input);
  assert.deepEqual(input.episode, episodeBefore);
  assert.deepEqual(input.factPack, factsBefore);
});

test('offline heuristic planning performs no network request and works without Recraft style', async () => {
  const input = makeInputs([{id: 'offline', visual: 'A simple door.'}]);
  let calls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => { calls += 1; throw new Error('network must not be used'); }) as typeof fetch;
  try {
    const result = await createAssetStrategyPlan(input);
    assert.equal(result.plan.styleStatus, 'missing');
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('AssetPlan output does not contain credentials or a Style ID field', async () => {
  const input = makeInputs([{id: 'secret-free', visual: 'A steam engine.'}]);
  const result = await createAssetStrategyPlan(input);
  const serialized = JSON.stringify(result.plan);
  assert.doesNotMatch(serialized, /styleId|RECRAFT_API_KEY|secret-sentinel/i);
  assert.equal(AssetPlanSchema.safeParse({...result.plan, styleId: 'must-not-serialize'}).success, false);
});
