import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {MockLLMProvider} from '../src/ai/MockLLMProvider';
import {ContentBriefSchema} from '../src/ai/contentBriefSchema';
import {EpisodeSchema} from '../src/episode/schema';
import {generateEpisode} from '../src/ai/pipeline';
import {MAX_VISUAL_PLAN_REPAIR_ATTEMPTS} from '../src/ai/generationConfig';
import {MockResearchProvider} from '../src/research/MockResearchProvider';
import {TavilyResearchProvider} from '../src/research/TavilyResearchProvider';
import {classifySourceTier, normalizeSourceUrl} from '../src/research/sourceQuality';
import {createFactPack, researchEpisode} from '../src/research/researchPipeline';
import {ResearchSourceSchema} from '../src/research/schemas';
import {auditVisualPlan} from '../src/visual/diversity';
import {VISUAL_ARCHETYPES, VISUAL_CAPABILITY_IDS, VisualPlanSchema} from '../src/visual/schemas';
import {createVisualPlan} from '../src/visual/visualDirector';

const brief = ContentBriefSchema.parse(JSON.parse(readFileSync('tests/fixtures/content-brief.json', 'utf8')) as unknown);
const episode = EpisodeSchema.parse(JSON.parse(readFileSync('tests/fixtures/generated-episode.json', 'utf8')) as unknown);
const queries = JSON.stringify({queries: ['choice overload original research', 'choice overload review', 'choice overload attribution']});
const assessment = (sourceIds: string[], status = 'verified') => JSON.stringify({summary: 'Evidence is context-dependent and does not establish a universal ideal number.', claims: [{id: 'claim-risk-01', claim: brief.riskFlags[0].claim, status, confidence: 'high', sourceIds, notes: 'Cited sources do not support a universal ideal number.', key: true}]});
const source = (id: string, url: string, tier: 'A' | 'B' | 'C') => ResearchSourceSchema.parse({id, title: `Evidence ${id}`, url, domain: new URL(url).hostname, snippet: 'Relevant evidence snippet for the tested claim.', sourceTier: tier, retrievedAt: '2026-10-04T00:00:00.000Z'});
const makeVisualPlan = (requiredCapabilities: string[], primaryArchetype: typeof VISUAL_ARCHETYPES[number] = 'network', fallbackArchetype?: typeof VISUAL_ARCHETYPES[number]) => ({
  episodeArchetype: 'network', persistentMotif: 'A single marker follows the changing choice space.',
  signatureMoment: 'New branches crowd the decision field until the original path becomes hard to see.',
  scenePlans: episode.scenes.map((scene) => ({
    sceneId: scene.id, primaryArchetype, visualSubject: 'A changing decision system made visible.',
    motionIdea: 'One new path enters and changes the flow.', cameraIntent: 'slow_push_in',
    spatialLayout: 'A centered visual system with open space around it.', continuityFromPrevious: '',
    reuseExistingPrimitive: 'Use capabilities described by the visual registry.', requiredCapabilities: [...requiredCapabilities],
    ...(fallbackArchetype ? {fallbackArchetype} : {}), textDominant: false,
  })),
});

test('source quality tiers prefer primary institutions and normalize duplicate tracking URLs', () => {
  assert.equal(classifySourceTier('journals.sagepub.com'), 'A');
  assert.equal(classifySourceTier('agency.gov'), 'A');
  assert.equal(classifySourceTier('www.britannica.com'), 'B');
  assert.equal(classifySourceTier('random-seo-site.example'), 'C');
  assert.equal(normalizeSourceUrl('https://www.example.org/path/?utm_source=feed#section'), 'https://example.org/path');
});

test('MockResearchProvider loads repository research fixtures without a live service', async () => {
  const results = await new MockResearchProvider().search('fixture query', {maxResults: 2});
  assert.equal(results.length, 2);
  assert.match(results[0].url, /^https:\/\//);
});

test('Fact Pack generation deduplicates URL variants and permits verified only with authoritative evidence', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'vibe-research-test-'));
  t.after(async () => rm(dir, {recursive: true, force: true}));
  const results = [
    {title: 'Review', url: 'https://journals.sagepub.com/doi/example?utm_source=first', snippet: 'A review of choice overload.', publishedDate: '2020-01-01'},
    {title: 'Duplicate URL', url: 'https://www.journals.sagepub.com/doi/example#abstract', snippet: 'Duplicate source should be removed.'},
    {title: 'Official context', url: 'https://www.apa.org/research/action/choice-context', snippet: 'Decision context affects choice.'},
  ];
  const llm = new MockLLMProvider({research_query_plan_v1: [queries], fact_assessment_v1: [assessment(['source-001'])]});
  const result = await researchEpisode({topic: brief.topic, id: 'choice-overload', brief, llm, research: new MockResearchProvider(results), maxSources: 10, researchRoot: dir});
  assert.equal(result.factPack.sources.length, 2);
  assert.equal(result.factPack.verifiedClaims.length, 1);
  assert.equal(result.factPack.uncertainClaims.length, 0);
  assert.equal(result.factPack.publicationReady, true);
  assert.equal(llm.calls.length, 2);
  assert.equal((await readFile(result.paths.sourcesMarkdown, 'utf8')).includes('https://journals.sagepub.com/doi/example'), true);
  assert.equal(JSON.parse(await readFile(result.paths.report, 'utf8')).publicationReady, true);
});

test('low quality-only evidence downgrades a model verification and keeps publication blocked', async () => {
  const factPack = await createFactPack({
    topic: brief.topic,
    brief,
    sources: [source('source-001', 'https://example.com/claim', 'C')],
    provider: new MockLLMProvider({fact_assessment_v1: [assessment(['source-001'])]}),
  });
  assert.equal(factPack.verifiedClaims.length, 0);
  assert.equal(factPack.uncertainClaims[0].status, 'partially_supported');
  assert.match(factPack.uncertainClaims[0].notes, /Local evidence gate/);
  assert.equal(factPack.publicationReady, true);
});

test('two independent Tier B domains meet the local verified-evidence threshold', async () => {
  const factPack = await createFactPack({
    topic: brief.topic,
    brief,
    sources: [source('source-001', 'https://reuters.com/article/choice', 'B'), source('source-002', 'https://britannica.com/topic/choice', 'B')],
    provider: new MockLLMProvider({fact_assessment_v1: [assessment(['source-001', 'source-002'])]}),
  });
  assert.equal(factPack.verifiedClaims[0].status, 'verified');
  assert.equal(factPack.verifiedClaims[0].confidence, 'high');
});

test('unverified and contradicted key claims block publication readiness', async () => {
  const factPack = await createFactPack({
    topic: brief.topic,
    brief,
    sources: [source('source-001', 'https://journals.sagepub.com/doi/example-claim', 'A')],
    provider: new MockLLMProvider({fact_assessment_v1: [assessment(['source-001'], 'contradicted')]}),
  });
  assert.equal(factPack.contradictedClaims[0].status, 'contradicted');
  assert.equal(factPack.publicationReady, false);
});

test('unsupported or missing assessment claims stay unverified and block publication', async () => {
  const noAssessment = JSON.stringify({summary: 'No assessment.', claims: []});
  const factPack = await createFactPack({topic: brief.topic, brief, sources: [], provider: new MockLLMProvider({fact_assessment_v1: [noAssessment]})});
  assert.equal(factPack.uncertainClaims[0].status, 'unverified');
  assert.equal(factPack.publicationReady, false);
});

test('Tavily errors redact credentials and requests are bounded to supplied max results', async () => {
  const secret = 'tvly-unit-secret';
  const previousKey = process.env.TAVILY_API_KEY;
  process.env.TAVILY_API_KEY = secret;
  try {
    const failed = new TavilyResearchProvider({fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as {max_results: number; api_key: string};
      assert.equal(body.max_results, 2);
      assert.equal(body.api_key, secret);
      return new Response(`invalid key ${secret}`, {status: 401});
    }});
    await assert.rejects(failed.search('choice overload', {maxResults: 2}), (error: unknown) => error instanceof Error && !error.message.includes(secret) && /HTTP 401/.test(error.message));
    await assert.rejects(failed.search('choice overload', {maxResults: 6}), /maxResults must be an integer from 1 to 5/);
    const successful = new TavilyResearchProvider({fetch: async () => new Response(JSON.stringify({results: [
      {title: 'Primary paper', url: 'https://doi.org/10.0000/example', content: 'Short evidence excerpt', published_date: '2023-01-01'},
      {title: 'Malformed row', url: 'not a URL', content: 'ignored'},
    ]}), {status: 200, headers: {'content-type': 'application/json'}})});
    const results = await successful.search('choice overload', {maxResults: 2});
    assert.equal(results.length, 1);
    assert.equal(results[0].title, 'Primary paper');
  } finally {
    if (previousKey === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = previousKey;
  }
  if (!previousKey) assert.throws(() => new TavilyResearchProvider(), /TAVILY_API_KEY is missing/);
});

test('all twelve visual archetypes validate; homogeneity audit warns and scores the plan', () => {
  assert.equal(VISUAL_ARCHETYPES.length, 12);
  const repeatedPlan = VisualPlanSchema.parse({
    episodeArchetype: 'network', persistentMotif: 'A single gold-marked doorway follows the choice.',
    signatureMoment: 'A network node glows brighter as more choices appear.',
    scenePlans: episode.scenes.map((scene) => ({
      sceneId: scene.id, primaryArchetype: 'network', visualSubject: 'A centered network diagram',
      motionIdea: 'Edges illuminate in sequence.', cameraIntent: 'slow_push_in', spatialLayout: 'Centered diagram with open space around it.',
      continuityFromPrevious: '', reuseExistingPrimitive: 'Network stage and glow path', requiredCapabilities: ['network-stage'], textDominant: false,
    })),
  });
  const longEpisode = {...episode, scenes: episode.scenes.map((scene, index) => index === 0 ? {...scene, durationSeconds: scene.durationSeconds + 20} : scene)};
  const report = auditVisualPlan(repeatedPlan, longEpisode);
  assert.equal(report.uniqueArchetypes, 1);
  assert.equal(report.networkSceneRatio, 1);
  assert.equal(report.signatureMomentPresent, false);
  assert.ok(report.visualDiversityScore >= 0 && report.visualDiversityScore <= 100);
  assert.ok(report.warnings.some((warning) => warning.includes('3+ primary archetypes')));
  assert.ok(report.warnings.some((warning) => warning.includes('Network scenes exceed half')));
  assert.ok(report.warnings.some((warning) => warning.includes('signature moment')));
});

test('visual plan rejects renderer implementation details and accepts concept-specific scene plans', () => {
  const valid = VisualPlanSchema.parse({
    episodeArchetype: 'object_world', persistentMotif: 'One door shape returns in each scene.',
    signatureMoment: 'The decision hallway physically fills until one passage is occluded.',
    scenePlans: episode.scenes.map((scene, index) => ({
      sceneId: scene.id, primaryArchetype: (['network', 'agents', 'geometric', 'probability', 'data_curve'] as const)[index % 5],
      visualSubject: 'The choice system changes in response to one added option.', motionIdea: 'The new option extends the comparison field.',
      cameraIntent: 'tracking', spatialLayout: 'A left-to-right space with a persistent doorway motif.', continuityFromPrevious: 'The same gold door marker moves into a new visual grammar.',
      reuseExistingPrimitive: 'Glow path with agent token', requiredCapabilities: ['agent-token'], textDominant: false,
    })),
  });
  assert.equal(valid.scenePlans.length, episode.scenes.length);
  assert.throws(() => VisualPlanSchema.parse({...valid, fontSize: 44}));
});

test('Visual Director provider flow validates scene mapping and returns diversity QA', async () => {
  const plan = {
    episodeArchetype: 'object_world', persistentMotif: 'A gold door marks the evolving decision space.',
    signatureMoment: 'The choice hallway fills with doors until the far exit disappears.',
    scenePlans: episode.scenes.map((scene, index) => ({
      sceneId: scene.id, primaryArchetype: (['network', 'agents', 'physical_system', 'geometric', 'probability'] as const)[index % 5], visualSubject: 'A choice space viewed as a changing physical world.',
      motionIdea: 'Each new option changes the environment.', cameraIntent: 'tracking', spatialLayout: 'Progressively branching left to right.',
      continuityFromPrevious: 'The gold door motif persists as the visual grammar changes.', reuseExistingPrimitive: 'Glow path and agent token',
      requiredCapabilities: ['agent-token'], ...(index % 5 === 2 ? {fallbackArchetype: 'agents' as const} : {}), textDominant: false,
    })),
  };
  const factPack = {verifiedClaims: [], safeConceptualClaims: ['More options can increase comparison work.']} as never;
  const provider = new MockLLMProvider({visual_plan_v1: [JSON.stringify(plan)]});
  const result = await createVisualPlan({brief: {topic: brief.topic}, factPack, episode, provider});
  assert.equal(result.plan.scenePlans.length, episode.scenes.length);
  assert.equal(result.diversity.uniqueArchetypes, 5);
  assert.equal(result.structuralRepairAttempts, 0);
  assert.equal(provider.calls[0].schemaName, 'visual_plan_v1');
  assert.match(provider.calls[0].instructions, /Never output font size, color, CSS/);
  assert.match(provider.calls[0].instructions, /Archetypes belong only/);
  assert.match(provider.calls[0].instructions, /"agent-token"/);
  const suppliedRegistry = provider.calls[0].instructions.split('Capability registry: ')[1]?.split('. Use fallbacks')[0] ?? '';
  assert.doesNotMatch(suppliedRegistry, /NetworkStage|AgentToken|MiniChart/);
});

test('VisualPlan repairs a non-canonical React component name once and preserves the Episode', async () => {
  const invalid = makeVisualPlan(['AgentToken']);
  const valid = makeVisualPlan(['agent-token']);
  const provider = new MockLLMProvider({visual_plan_v1: [JSON.stringify(invalid), JSON.stringify(valid)]});
  const before = JSON.stringify(episode);
  const result = await createVisualPlan({brief: {topic: brief.topic}, factPack: {verifiedClaims: [], safeConceptualClaims: []} as never, episode, provider});
  assert.equal(result.structuralRepairAttempts, 1);
  assert.deepEqual(result.plan.scenePlans[0].requiredCapabilities, ['agent-token']);
  assert.match(provider.calls[1].instructions, /repair-visual-plan-v1/);
  assert.match(provider.calls[1].input, /scenePlans\[0\]\.requiredCapabilities\[0\]/);
  assert.match(provider.calls[1].instructions, /Do not edit Episode copy/);
  assert.equal(JSON.stringify(episode), before);
});

test('VisualPlan structural repair stops after one repair for repeated invalid capability IDs', async () => {
  const invalid = JSON.stringify(makeVisualPlan(['AgentToken']));
  const provider = new MockLLMProvider({visual_plan_v1: [invalid, invalid, JSON.stringify(makeVisualPlan(['agent-token']))]});
  await assert.rejects(
    createVisualPlan({brief: {topic: brief.topic}, factPack: {verifiedClaims: [], safeConceptualClaims: []} as never, episode, provider}),
    (error: unknown) => error instanceof Error && /VisualPlan validation failed after 2 attempt\(s\)/.test(error.message) && /canonical capability ID/.test(error.message),
  );
  assert.equal(MAX_VISUAL_PLAN_REPAIR_ATTEMPTS, 1);
  assert.equal(provider.calls.length, 2);
});

test('VisualPlan rejects unknown capability IDs and archetype names in capability fields', () => {
  assert.throws(() => VisualPlanSchema.parse(makeVisualPlan(['magic-3d-world'])), /Invalid option/);
  assert.throws(() => VisualPlanSchema.parse(makeVisualPlan(['object_world'])), /Invalid option/);
});

test('VisualPlan requires a fallback for limited archetypes and repairs it once', async () => {
  const invalid = makeVisualPlan(['counter'], 'physical_system');
  const valid = makeVisualPlan(['counter'], 'physical_system', 'agents');
  const provider = new MockLLMProvider({visual_plan_v1: [JSON.stringify(invalid), JSON.stringify(valid)]});
  const result = await createVisualPlan({brief: {topic: brief.topic}, factPack: {verifiedClaims: [], safeConceptualClaims: []} as never, episode, provider});
  assert.equal(result.structuralRepairAttempts, 1);
  assert.equal(result.plan.scenePlans[0].fallbackArchetype, 'agents');
  assert.match(provider.calls[1].input, /fallbackArchetype: required because primary archetype physical_system is limited/);
});

test('all canonical VisualPlan capability IDs validate', async () => {
  const chunks: string[][] = [];
  for (let index = 0; index < VISUAL_CAPABILITY_IDS.length; index += 12) chunks.push([...VISUAL_CAPABILITY_IDS.slice(index, index + 12)]);
  const plan = makeVisualPlan(['network-stage']);
  for (const [index, scene] of plan.scenePlans.entries()) scene.requiredCapabilities = chunks[index % chunks.length];
  const provider = new MockLLMProvider({visual_plan_v1: [JSON.stringify(plan)]});
  const result = await createVisualPlan({brief: {topic: brief.topic}, factPack: {verifiedClaims: [], safeConceptualClaims: []} as never, episode, provider});
  assert.equal(result.structuralRepairAttempts, 0);
  assert.deepEqual(new Set(result.plan.scenePlans.flatMap((scene) => scene.requiredCapabilities)), new Set(VISUAL_CAPABILITY_IDS));
});

test('verified generation prompt excludes uncertain and contradicted claims', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'vibe-verified-test-'));
  t.after(async () => rm(dir, {recursive: true, force: true}));
  const roots = {generatedRoot: path.join(dir, 'generated'), episodesRoot: path.join(dir, 'episodes')};
  const factPack = {
    topic: brief.topic, summary: 'Test evidence.', verifiedClaims: [],
    uncertainClaims: [{id: 'claim-risk-01', claim: 'unverified only secret phrase', status: 'unverified', confidence: 'low', sourceIds: [], notes: '', key: true}],
    contradictedClaims: [{id: 'claim-risk-02', claim: 'contradicted secret phrase', status: 'contradicted', confidence: 'medium', sourceIds: [], notes: '', key: true}],
    safeConceptualClaims: ['A comparison system can become more demanding.'], sources: [], publicationReady: false,
  } as never;
  const provider = new MockLLMProvider({content_brief_v1: [readFileSync('tests/fixtures/content-brief.json', 'utf8')], episode_v1: [readFileSync('tests/fixtures/generated-episode.json', 'utf8')]});
  const result = await generateEpisode({topic: brief.topic, id: 'verified-choice-test', durationSeconds: 60, verifiedFactPack: factPack}, provider, roots);
  const briefRequest = provider.calls.find((call) => call.schemaName === 'content_brief_v1')!;
  const episodeRequest = provider.calls.find((call) => call.schemaName === 'episode_v1')!;
  assert.match(briefRequest.instructions, /Use ONLY verified claims or safe conceptual claims/);
  assert.match(episodeRequest.instructions, /Do not reintroduce rejected/);
  assert.doesNotMatch(briefRequest.input + episodeRequest.input, /unverified only secret phrase|contradicted secret phrase/);
  assert.equal(result.report.publicationReady, false);
});

test('verified-only constraints also survive ContentBrief and Episode repair requests', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'vibe-verified-repair-test-'));
  t.after(async () => rm(dir, {recursive: true, force: true}));
  const factPack = {
    topic: brief.topic, summary: 'Test evidence.', verifiedClaims: [], uncertainClaims: [], contradictedClaims: [],
    safeConceptualClaims: ['A comparison system can become more demanding.'], sources: [], publicationReady: false,
  } as never;
  const oversizedBrief = JSON.parse(readFileSync('tests/fixtures/content-brief.json', 'utf8')) as Record<string, unknown>;
  oversizedBrief.visualMetaphor = 'x'.repeat(527);
  const provider = new MockLLMProvider({
    content_brief_v1: [JSON.stringify(oversizedBrief), readFileSync('tests/fixtures/content-brief.json', 'utf8')],
    episode_v1: [readFileSync('tests/fixtures/invalid-episode.json', 'utf8'), readFileSync('tests/fixtures/generated-episode.json', 'utf8')],
  });
  await generateEpisode({topic: brief.topic, id: 'verified-choice-repair-test', durationSeconds: 60, verifiedFactPack: factPack}, provider, {generatedRoot: path.join(dir, 'generated'), episodesRoot: path.join(dir, 'episodes')});
  const repairRequests = provider.calls.slice(1).filter((call) => call.schemaName === 'content_brief_v1' || call.schemaName === 'episode_v1');
  assert.equal(repairRequests.length, 3);
  assert.ok(repairRequests.every((call) => /VERIFIED MODE: Use ONLY/.test(call.instructions)));
  assert.ok(repairRequests.every((call) => /safeConceptualClaims/.test(call.input)));
});
