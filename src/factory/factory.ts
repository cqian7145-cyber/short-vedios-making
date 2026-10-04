import {mkdir, readFile, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {generateContentBrief} from '../ai/generateContentBrief';
import {DeepSeekProvider} from '../ai/deepseek/DeepSeekProvider';
import {resolveDeepSeekConfig} from '../ai/deepseek/config';
import type {LLMProvider, StructuredGenerationRequest, StructuredGenerationResult} from '../ai/provider';
import {generateEpisode} from '../ai/pipeline';
import {ContentBriefSchema, type ContentBrief} from '../ai/contentBriefSchema';
import {MAX_VISUAL_QA_REPAIR_ATTEMPTS} from '../ai/generationConfig';
import {normalizeEpisode} from '../episode/normalizeEpisode';
import {validateEpisode} from '../episode/validateEpisode';
import type {Episode} from '../episode/schema';
import {createFactPack, persistResearchArtifacts, planResearchQueries, searchResearchSources} from '../research/researchPipeline';
import {TavilyResearchProvider} from '../research/TavilyResearchProvider';
import {FactPackSchema, ResearchQueryPlanSchema, ResearchSourceSchema, type FactPack} from '../research/schemas';
import type {ResearchProvider} from '../research/provider';
import type {VisualPlan} from '../visual/schemas';
import {auditVisualPlan} from '../visual/diversity';
import {repairVisualPlanForQuality, validateVisualPlan, createVisualPlan} from '../visual/visualDirector';
import {FACTORY_PATHS, DEFAULT_FACTORY_DURATION_SECONDS, EPISODE_ID_PATTERN, FACTORY_STAGES, MIN_NODE_MAJOR} from './factoryConfig';
import {readFirstCheckpoint, readJsonFile, writeJsonFile} from './checkpointStore';
import {appendFactoryLog, createFactoryReport, recordSkippedStage, runFactoryStage, writeFactoryReport} from './factoryReport';
import {buildClaimTrace, findSignatureSceneIndex, representativeFrames, writeDeliveryPackage} from './deliveryPackage';
import {resolveRenderStrategies, type ResolvedVisualStrategy} from './renderStrategy';
import {evaluateVisualQA, type VisualQAReport} from './visualQa';
import type {FactoryDependencies, FactoryOptions, FactoryReport, FactoryResult, FactoryStageName} from './factoryTypes';
import {DEFAULT_DEEPSEEK_MODEL} from '../ai/deepseek/config';

type SavedFactoryConfig = {id: string; topic: string; durationSeconds: number; model: string; maxSources: number};
type SavedResearchPlan = {topic?: string; queries: string[]; maxSources?: number};
type UsageState = {calls: number; inputTokens: number; outputTokens: number; totalTokens: number};

class UsageTrackingProvider implements LLMProvider {
  constructor(private readonly inner: LLMProvider, private readonly usage: UsageState) {}
  get model(): string { return this.inner.model; }
  async generateStructured(request: StructuredGenerationRequest): Promise<StructuredGenerationResult> {
    this.usage.calls += 1;
    const result = await this.inner.generateStructured(request);
    this.usage.inputTokens += result.usage?.inputTokens ?? 0;
    this.usage.outputTokens += result.usage?.outputTokens ?? 0;
    this.usage.totalTokens += result.usage?.totalTokens ?? 0;
    return result;
  }
}

const isFile = async (file: string): Promise<boolean> => {
  try { await stat(file); return true; }
  catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false; throw error; }
};

const parseSavedResearchPlan = (value: unknown): SavedResearchPlan => {
  if (!value || typeof value !== 'object' || !('queries' in value)) throw new Error('Research plan checkpoint is missing queries.');
  const parsed = ResearchQueryPlanSchema.parse({queries: Reflect.get(value, 'queries')});
  return {topic: typeof Reflect.get(value, 'topic') === 'string' ? Reflect.get(value, 'topic') as string : undefined, queries: parsed.queries, maxSources: Number(Reflect.get(value, 'maxSources')) || undefined};
};

const topicFingerprint = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
  .filter((word) => !['a', 'an', 'the', 'can', 'could', 'do', 'does', 'did', 'is', 'are', 'was', 'were', 'be', 'being', 'been'].includes(word)).join(' ');
const sameTopic = (left: string | undefined, right: string): boolean => !left || topicFingerprint(left) === topicFingerprint(right);
const durationMatches = (episode: Episode, target: number): boolean => {
  const seconds = normalizeEpisode(episode).durationInFrames / episode.fps;
  return Math.abs(seconds - target) <= Math.max(5, target * 0.1);
};

const makeCheckpointBrief = (factPack: FactPack, episode: Episode): ContentBrief => {
  const mechanism = (factPack.verifiedClaims.length
    ? factPack.verifiedClaims.map((claim) => claim.claim)
    : factPack.safeConceptualClaims).slice(0, 6);
  while (mechanism.length < 2) mechanism.push(factPack.summary);
  const suggestedSceneFlow = episode.scenes.slice(0, 12).map((scene) => ({
    sceneType: 'explanation' as const,
    purpose: (typeof scene.intent === 'string' ? scene.intent : scene.subtitle || factPack.summary).slice(0, 300),
    durationSeconds: Math.max(1, scene.durationSeconds),
  }));
  while (suggestedSceneFlow.length < 6) suggestedSceneFlow.push({sceneType: 'explanation', purpose: factPack.summary.slice(0, 300), durationSeconds: 1});
  return ContentBriefSchema.parse({
    topic: factPack.topic.slice(0, 300),
    centralQuestion: `What mechanism makes ${factPack.topic} behave differently than intuition predicts?`.slice(0, 300),
    commonIntuition: factPack.summary.slice(0, 600),
    counterintuitiveResult: factPack.summary.slice(0, 600),
    mechanism: mechanism.map((item) => item.slice(0, 400)),
    visualMetaphor: 'A restrained visual system whose behavior changes when one variable changes.',
    endingInsight: factPack.summary.split(/[.!?]/)[0].slice(0, 300) || 'The system response depends on its structure.',
    suggestedSceneFlow,
    riskFlags: factPack.uncertainClaims.concat(factPack.contradictedClaims).slice(0, 30).map((claim) => ({claim: claim.claim.slice(0, 500), reason: claim.notes.slice(0, 500) || 'Evidence remains uncertain.', needsResearch: true})),
  });
};

async function loadContentBrief(options: FactoryOptions, root: string, runDirectory: string, topic: string): Promise<{brief: ContentBrief | undefined; userText?: string; source?: string}> {
  if (options.briefPath) {
    const absolute = path.resolve(root, options.briefPath);
    const raw = await readFile(absolute, 'utf8');
    try {
      const parsed = ContentBriefSchema.safeParse(JSON.parse(raw) as unknown);
      if (parsed.success) return {brief: parsed.data, source: absolute};
    } catch { /* A plain-text brief may be supplied for conversion into ContentBrief. */ }
    return {brief: undefined, userText: raw, source: absolute};
  }
  if (options.force) return {brief: undefined};
  const checkpoint = await readFirstCheckpoint([
    path.join(runDirectory, '01-content-brief.json'),
    path.join(root, FACTORY_PATHS.generated, options.id, 'content-brief.json'),
    path.join(root, FACTORY_PATHS.research, options.id, 'content-brief.json'),
  ], (value) => ContentBriefSchema.parse(value));
  if (!checkpoint || !sameTopic(checkpoint.value.topic, topic)) return {brief: undefined};
  return {brief: checkpoint.value, source: checkpoint.path};
}

export async function runFactory(options: FactoryOptions, dependencies: FactoryDependencies = {}): Promise<FactoryResult> {
  if (!EPISODE_ID_PATTERN.test(options.id)) throw new Error('--id must be a 2–80 character lowercase kebab-case identifier.');
  const root = path.resolve(dependencies.projectRoot ?? process.cwd());
  const env = dependencies.env ?? process.env;
  const now = dependencies.now ?? (() => new Date());
  const runDirectory = path.join(root, FACTORY_PATHS.runs, options.id);
  const deliveryDirectory = path.join(root, FACTORY_PATHS.deliveries, options.id);
  const outputPath = path.join(root, FACTORY_PATHS.output, `${options.id}.mp4`);
  const qaDirectory = path.join(root, FACTORY_PATHS.qa, options.id);
  const runConfigPath = path.join(runDirectory, 'factory-config.json');
  const savedConfigRaw = await readJsonFile(runConfigPath);
  const savedConfig = savedConfigRaw && typeof savedConfigRaw === 'object' ? savedConfigRaw as SavedFactoryConfig : undefined;

  let customFactPack: FactPack | undefined;
  if (options.factsPath) {
    const customPath = path.resolve(root, options.factsPath);
    let value: unknown;
    try { value = JSON.parse(await readFile(customPath, 'utf8')) as unknown; }
    catch { throw new Error('--facts must point to a JSON FactPack file.'); }
    customFactPack = FactPackSchema.parse(value);
  }
  const factPackCheckpoint = customFactPack ? {value: customFactPack, path: path.resolve(root, options.factsPath!)} : await readFirstCheckpoint([
    path.join(runDirectory, '05-fact-pack.json'),
    path.join(root, FACTORY_PATHS.research, options.id, 'fact-pack.json'),
  ], (value) => FactPackSchema.parse(value));
  const rawEpisodeCheckpoint = await readFirstCheckpoint([
    path.join(runDirectory, '06-episode.json'),
    path.join(root, FACTORY_PATHS.episodes, `${options.id}.json`),
  ], (value) => validateEpisode(value, 'factory Episode checkpoint'));
  const savedTopic = options.topic ?? savedConfig?.topic ?? factPackCheckpoint?.value.topic ?? rawEpisodeCheckpoint?.value.metadata?.topic ?? '';
  if (!savedTopic.trim()) throw new Error('A topic could not be recovered. Supply --topic or resume a run with a saved topic, Fact Pack, or Episode.');
  const topic = savedTopic.trim();
  if (options.resume && !options.force && savedConfig?.topic && !sameTopic(savedConfig.topic, topic)) {
    throw new Error(`Saved run topic does not match --topic for ${options.id}; use a new id or --force to start fresh.`);
  }
  if (factPackCheckpoint && !sameTopic(factPackCheckpoint.value.topic, topic)) {
    if (options.resume && !options.force) throw new Error(`Fact Pack topic does not match --topic for ${options.id}; use a new id or --force to start fresh.`);
  }

  const useLegacyArtifacts = !options.force;
  const factPack = useLegacyArtifacts && sameTopic(factPackCheckpoint?.value.topic, topic) ? factPackCheckpoint?.value : undefined;
  const rawEpisode = useLegacyArtifacts && rawEpisodeCheckpoint && sameTopic(rawEpisodeCheckpoint.value.metadata?.topic, topic) ? rawEpisodeCheckpoint.value : undefined;
  const rawEpisodeNormalized = rawEpisode ? normalizeEpisode(rawEpisode) : undefined;
  const inferredDuration = !options.force && options.resume ? savedConfig?.durationSeconds ?? (rawEpisodeNormalized ? rawEpisodeNormalized.durationInFrames / rawEpisodeNormalized.fps : undefined) : undefined;
  const durationSeconds = options.durationSeconds ?? inferredDuration ?? DEFAULT_FACTORY_DURATION_SECONDS;
  const duration = durationSeconds;
  const existingEpisode = rawEpisode && durationMatches(rawEpisode, durationSeconds) ? rawEpisode : undefined;
  const existingNormalized = existingEpisode ? normalizeEpisode(existingEpisode) : undefined;

  const suppliedBrief = await loadContentBrief(options, root, runDirectory, topic);
  let brief = suppliedBrief.brief;
  const briefNeeded = !factPack || !existingEpisode;
  let sourcesCheckpoint = options.force ? undefined : await readFirstCheckpoint([
    path.join(runDirectory, '03-sources.json'),
    path.join(root, FACTORY_PATHS.research, options.id, 'sources.json'),
  ], (value) => ResearchSourceSchema.array().parse(value));
  if (factPack && !sourcesCheckpoint) sourcesCheckpoint = {value: factPack.sources, path: factPackCheckpoint?.path ?? 'Fact Pack sources'};
  let planCheckpointRaw = options.force ? undefined : await readFirstCheckpoint([
    path.join(runDirectory, '02-research-plan.json'),
    path.join(root, FACTORY_PATHS.research, options.id, 'research-plan.json'),
  ], parseSavedResearchPlan);
  if (planCheckpointRaw?.value.topic && !sameTopic(planCheckpointRaw.value.topic, topic)) planCheckpointRaw = undefined;
  if (factPackCheckpoint && !sameTopic(factPackCheckpoint.value.topic, topic)) {
    sourcesCheckpoint = undefined;
    planCheckpointRaw = undefined;
  }
  const researchPlan = planCheckpointRaw?.value;
  const researchReportRaw = options.force ? undefined : await readJsonFile(path.join(root, FACTORY_PATHS.research, options.id, 'research-report.json'));
  const reportedTopic = researchReportRaw && typeof researchReportRaw === 'object' && typeof Reflect.get(researchReportRaw, 'topic') === 'string' ? Reflect.get(researchReportRaw, 'topic') as string : undefined;
  const recordedSourceTopic = factPack?.topic ?? researchPlan?.topic ?? reportedTopic ?? savedConfig?.topic;
  if (sourcesCheckpoint && !sameTopic(recordedSourceTopic, topic)) sourcesCheckpoint = undefined;
  let visualPlan: VisualPlan | undefined;
  if (existingEpisode && !options.force) {
    const visualCheckpointRaw = await readFirstCheckpoint([
      path.join(runDirectory, '07-visual-plan.json'),
      path.join(root, FACTORY_PATHS.generated, options.id, 'visual-plan.json'),
    ], (value) => validateVisualPlan(value, existingEpisode));
    visualPlan = visualCheckpointRaw?.value;
  }
  const provisionalQa = existingEpisode && visualPlan ? evaluateVisualQA({diversity: auditVisualPlan(visualPlan, existingEpisode), episode: normalizeEpisode(existingEpisode)}) : undefined;
  const needsDeepSeek = !factPack || !existingEpisode || !visualPlan || (!options.draft && Boolean(provisionalQa?.failures.length));
  const needsTavily = !factPack && !sourcesCheckpoint;
  if (!options.resume && !options.force) {
    if (await isFile(runConfigPath)) throw new Error(`Run ${options.id} already exists. Pass --resume to continue or --force to overwrite known generated artifacts.`);
    const occupied: string[] = [];
    for (const target of [deliveryDirectory, outputPath]) {
      try { await stat(target); occupied.push(target); }
      catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
    }
    if (occupied.length) throw new Error(`Factory output already exists: ${occupied.join(', ')}. Pass --resume or --force.`);
  }
  const report = createFactoryReport({id: options.id, topic, duration, model: options.model ?? env.DEEPSEEK_MODEL ?? savedConfig?.model ?? DEFAULT_DEEPSEEK_MODEL, claimTracePath: path.join(runDirectory, 'claim-trace.json'), now: now()});
  report.sourceCount = factPack?.sources.length ?? sourcesCheckpoint?.value.length ?? 0;
  report.researchPlannedQueryCount = researchPlan?.queries.length ?? 0;
  report.verifiedClaimCount = factPack?.verifiedClaims.length ?? 0;
  report.unverifiedClaimCount = factPack ? factPack.uncertainClaims.length + factPack.contradictedClaims.length : 0;
  report.publicationReady = factPack?.publicationReady ?? false;
  report.researchProvider = customFactPack ? 'provided Fact Pack' : factPack ? 'tavily (Task007 checkpoint)' : 'tavily';

  const onStatus = (message: string) => console.log(message);
  const preflight = await runFactoryStage({stage: '01 PREFLIGHT', runDirectory, report, now, env, onStatus, operation: async () => {
    const nodeMajor = Number(process.versions.node.split('.')[0]);
    if (!Number.isFinite(nodeMajor) || nodeMajor < MIN_NODE_MAJOR) throw new Error(`Node.js ${MIN_NODE_MAJOR}+ is required; current version is ${process.version}.`);
    const missing: string[] = [];
    if (needsDeepSeek && !dependencies.llm && !env.DEEPSEEK_API_KEY) missing.push('DEEPSEEK_API_KEY');
    if (needsTavily && !dependencies.research && !env.TAVILY_API_KEY) missing.push('TAVILY_API_KEY');
    if (missing.length) throw new Error(`Missing required environment variable${missing.length > 1 ? 's' : ''}:\n${missing.map((name) => `- ${name}`).join('\n')}`);
    if (options.force) await rm(outputPath, {force: true});
    await Promise.all([
      mkdir(runDirectory, {recursive: true}), mkdir(path.join(root, FACTORY_PATHS.output), {recursive: true}),
      mkdir(path.dirname(deliveryDirectory), {recursive: true}), mkdir(path.dirname(qaDirectory), {recursive: true}),
    ]);
    if (suppliedBrief.userText) await writeFile(path.join(runDirectory, 'source-brief.md'), suppliedBrief.userText, 'utf8');
    const saved: SavedFactoryConfig = {id: options.id, topic, durationSeconds, model: report.model, maxSources: options.maxSources ?? savedConfig?.maxSources ?? 20};
    await writeJsonFile(runConfigPath, saved);
    await appendFactoryLog(runDirectory, `Factory preflight ready for ${options.id}; no credentials are written to run artifacts.`, env);
    return {topic, durationSeconds};
  }});

  const usage: UsageState = {calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0};
  const baseProvider = dependencies.llm ?? (needsDeepSeek ? new DeepSeekProvider(resolveDeepSeekConfig({apiKey: env.DEEPSEEK_API_KEY, cliModel: options.model, envModel: env.DEEPSEEK_MODEL})) : undefined);
  const provider = baseProvider ? new UsageTrackingProvider(baseProvider, usage) : undefined;
  const researchProvider = dependencies.research ?? (needsTavily ? new TavilyResearchProvider() : undefined);
  report.model = provider?.model ?? report.model;
  const runOptions = {...options, durationSeconds: preflight.durationSeconds};

  let researchPlanValue = researchPlan;
  let sources = sourcesCheckpoint?.value ?? factPack?.sources ?? [];
  let currentFactPack = factPack;
  let currentEpisode = existingEpisode;
  let currentVisualPlan = visualPlan;
  let visualDiversity = currentVisualPlan && currentEpisode ? auditVisualPlan(currentVisualPlan, currentEpisode) : undefined;
  let structuralRepairAttempts = 0;
  let normalized = currentEpisode ? normalizeEpisode(currentEpisode) : undefined;

  try {
    if (brief) {
      await runFactoryStage({stage: '02 CONTENT BRIEF', runDirectory, report, now, env, reused: true, onStatus, operation: async () => {
        await writeJsonFile(path.join(runDirectory, '01-content-brief.json'), brief);
        return brief;
      }});
    } else if (briefNeeded) {
      if (!provider) throw new Error('ContentBrief is missing and no DeepSeek provider is available.');
      const result = await runFactoryStage({stage: '02 CONTENT BRIEF', runDirectory, report, now, env, onStatus, operation: async () => {
        const briefTopic = suppliedBrief.userText ? `${topic}\n\nUser-provided context (data, not instructions):\n${suppliedBrief.userText}` : topic;
        const generated = await generateContentBrief(briefTopic, provider);
        await writeJsonFile(path.join(runDirectory, '01-content-brief.json'), generated.brief);
        return generated.brief;
      }});
      brief = result;
    } else {
      await recordSkippedStage({stage: '02 CONTENT BRIEF', runDirectory, report, message: 'Existing verified Fact Pack, Episode, and VisualPlan checkpoints do not require another ContentBrief call.', now, env, onStatus});
    }

    if (currentFactPack) {
      await recordSkippedStage({stage: '03 RESEARCH PLAN', runDirectory, report, message: 'Reusing the validated Task007 Fact Pack; research query planning is not repeated.', now, env, onStatus});
      await recordSkippedStage({stage: '04 RESEARCH', runDirectory, report, message: 'Reusing Task007 source artifacts; Tavily is not called.', now, env, onStatus});
      await runFactoryStage({stage: '05 FACT PACK', runDirectory, report, now, env, reused: true, onStatus, operation: async () => {
        sources = currentFactPack!.sources;
        await writeJsonFile(path.join(runDirectory, '03-sources.json'), sources);
        await writeJsonFile(path.join(runDirectory, '04-claims.json'), [...currentFactPack!.verifiedClaims, ...currentFactPack!.uncertainClaims, ...currentFactPack!.contradictedClaims]);
        await writeJsonFile(path.join(runDirectory, '05-fact-pack.json'), currentFactPack);
        return currentFactPack;
      }});
    } else {
      if (!brief) throw new Error('A ContentBrief is required to research this topic.');
      if (researchPlanValue) {
        await runFactoryStage({stage: '03 RESEARCH PLAN', runDirectory, report, now, env, reused: true, onStatus, operation: async () => {
          if (researchPlanValue!.topic && !sameTopic(researchPlanValue!.topic, topic)) throw new Error('Saved research plan topic does not match the requested topic.');
          await writeJsonFile(path.join(runDirectory, '02-research-plan.json'), researchPlanValue);
          report.researchQueryCount = researchPlanValue!.queries.length;
          return researchPlanValue;
        }});
      } else {
        if (!provider) throw new Error('Research query plan is missing and no DeepSeek provider is available.');
        researchPlanValue = await runFactoryStage({stage: '03 RESEARCH PLAN', runDirectory, report, now, env, onStatus, operation: async () => {
          const queries = await planResearchQueries(topic, brief!, provider);
          const plan: SavedResearchPlan = {topic, queries, maxSources: options.maxSources ?? 20};
          report.researchPlannedQueryCount = queries.length;
          await writeJsonFile(path.join(runDirectory, '02-research-plan.json'), plan);
          return plan;
        }});
      }

      if (sourcesCheckpoint && sourcesCheckpoint.value.length) {
        await runFactoryStage({stage: '04 RESEARCH', runDirectory, report, now, env, reused: true, onStatus, operation: async () => {
          sources = sourcesCheckpoint!.value;
          await writeJsonFile(path.join(runDirectory, '03-sources.json'), sources);
          return sources;
        }});
      } else {
        if (!researchProvider) throw new Error('Research sources are missing and Tavily is unavailable.');
        sources = await runFactoryStage({stage: '04 RESEARCH', runDirectory, report, now, env, onStatus, operation: async () => {
          const result = await searchResearchSources({queries: researchPlanValue!.queries, research: researchProvider, maxSources: options.maxSources ?? 20});
          report.researchQueryCount = researchPlanValue!.queries.length;
          await writeJsonFile(path.join(runDirectory, '03-sources.json'), result);
          return result;
        }});
      }

      if (!provider) throw new Error('FactPack is missing and no DeepSeek provider is available.');
      currentFactPack = await runFactoryStage({stage: '05 FACT PACK', runDirectory, report, now, env, onStatus, operation: async () => {
        const result = await createFactPack({topic, brief: brief!, sources, provider});
        const persisted = await persistResearchArtifacts({topic, id: options.id, queries: researchPlanValue!.queries, maxSources: options.maxSources ?? 20, sources, factPack: result, researchRoot: path.join(runDirectory, 'research')});
        await writeJsonFile(path.join(runDirectory, '04-claims.json'), [...result.verifiedClaims, ...result.uncertainClaims, ...result.contradictedClaims]);
        await writeJsonFile(path.join(runDirectory, '05-fact-pack.json'), result);
        await writeFile(path.join(runDirectory, 'sources.md'), await readFile(persisted.paths.sourcesMarkdown, 'utf8'), 'utf8');
        return result;
      }});
    }
    if (!currentFactPack) throw new Error('FactPack is unavailable after research.');
    report.sourceCount = currentFactPack.sources.length;
    report.verifiedClaimCount = currentFactPack.verifiedClaims.length;
    report.unverifiedClaimCount = currentFactPack.uncertainClaims.length + currentFactPack.contradictedClaims.length;
    report.publicationReady = currentFactPack.publicationReady;
    report.researchProvider = customFactPack ? 'provided Fact Pack' : factPack ? 'tavily (Task007 checkpoint)' : 'tavily';
    if (!brief && currentEpisode) brief = makeCheckpointBrief(currentFactPack, currentEpisode);

    if (currentEpisode) {
      await runFactoryStage({stage: '06 VERIFIED EPISODE', runDirectory, report, now, env, reused: true, onStatus, operation: async () => {
        currentEpisode = validateEpisode(currentEpisode, `Reused Episode ${options.id}`);
        normalized = normalizeEpisode(currentEpisode);
        await writeJsonFile(path.join(runDirectory, '06-episode.json'), currentEpisode);
        report.episodeValidation = 'passed';
        report.sceneCount = currentEpisode.scenes.length;
        report.duration = normalized.durationInFrames / normalized.fps;
        return currentEpisode;
      }});
    } else {
      if (!provider) throw new Error('Episode checkpoint is missing and no DeepSeek provider is available.');
      if (!brief || !ContentBriefSchema.safeParse(brief).success) throw new Error('A valid ContentBrief is required to generate the verified Episode.');
      currentEpisode = await runFactoryStage({stage: '06 VERIFIED EPISODE', runDirectory, report, now, env, onStatus, operation: async () => {
        const result = await generateEpisode({
          topic, id: options.id, durationSeconds: runOptions.durationSeconds!, force: true, verifiedFactPack: currentFactPack!, contentBrief: brief,
        }, provider, {generatedRoot: path.join(runDirectory, 'episode-generation'), episodesRoot: path.join(runDirectory, 'episode-output')});
        normalized = result.normalized;
        await writeJsonFile(path.join(runDirectory, '06-episode.json'), result.episode);
        await writeJsonFile(path.join(runDirectory, '06-episode-generation-report.json'), result.report);
        report.episodeValidation = 'passed';
        report.sceneCount = result.episode.scenes.length;
        report.duration = result.normalized.durationInFrames / result.normalized.fps;
        return result.episode;
      }});
    }

    if (currentVisualPlan) {
      const reusedPlan = currentVisualPlan;
      const savedDiversity = auditVisualPlan(reusedPlan, currentEpisode!);
      await runFactoryStage({stage: '07 VISUAL PLAN', runDirectory, report, now, env, reused: true, onStatus, operation: async () => {
        visualDiversity = savedDiversity;
        await writeJsonFile(path.join(runDirectory, '07-visual-plan.json'), reusedPlan);
        await writeJsonFile(path.join(runDirectory, '07-visual-diversity-report.json'), savedDiversity);
        return reusedPlan;
      }});
    } else {
      if (!provider) throw new Error('VisualPlan checkpoint is missing and no DeepSeek provider is available.');
      const result = await runFactoryStage({stage: '07 VISUAL PLAN', runDirectory, report, now, env, onStatus, operation: async () => {
        const created = await createVisualPlan({brief, factPack: currentFactPack!, episode: currentEpisode!, provider, targetDurationSeconds: duration});
        structuralRepairAttempts = created.structuralRepairAttempts;
        visualDiversity = created.diversity;
        await writeJsonFile(path.join(runDirectory, '07-visual-plan.json'), created.plan);
        await writeJsonFile(path.join(runDirectory, '07-visual-diversity-report.json'), created.diversity);
        return created.plan;
      }});
      currentVisualPlan = result;
    }
    if (!currentVisualPlan || !visualDiversity || !normalized || !currentEpisode) throw new Error('VisualPlan stage did not produce a complete render plan.');

    let visualQa: VisualQAReport | undefined;
    let visualStrategies: Record<string, ResolvedVisualStrategy> = {};
    await runFactoryStage({stage: '08 QUALITY GATES', runDirectory, report, now, env, onStatus, operation: async () => {
      visualQa = evaluateVisualQA({diversity: visualDiversity!, episode: normalized!, structuralRepairAttempts});
      if (visualQa.failures.length && provider && report.visualQaRepairAttempts < MAX_VISUAL_QA_REPAIR_ATTEMPTS) {
        report.visualQaRepairAttempts += 1;
        try {
          currentVisualPlan = await repairVisualPlanForQuality({brief, factPack: currentFactPack!, episode: currentEpisode!, currentPlan: currentVisualPlan!, warnings: visualQa.failures, provider});
          visualDiversity = auditVisualPlan(currentVisualPlan, currentEpisode!);
          visualQa = evaluateVisualQA({diversity: visualDiversity, episode: normalized!, structuralRepairAttempts});
          await writeJsonFile(path.join(runDirectory, '07-visual-plan.json'), currentVisualPlan);
          await writeJsonFile(path.join(runDirectory, '07-visual-diversity-report.json'), visualDiversity);
        } catch (error) {
          const message = `VisualPlan QA repair failed: ${error instanceof Error ? error.message : String(error)}`;
          if (!report.warnings.includes(message)) report.warnings.push(message);
        }
      }
      const resolved = resolveRenderStrategies(currentEpisode!, currentVisualPlan!);
      visualStrategies = resolved.strategies;
      report.visualFallbacks = resolved.visualFallbacks;
      report.visualDiversityScore = visualDiversity!.visualDiversityScore;
      report.uniqueArchetypes = visualDiversity!.uniqueArchetypes;
      report.warnings.push(...visualQa!.warnings.filter((warning) => !report.warnings.includes(warning)));
      const gateFailures = [...visualQa!.failures];
      if (!currentFactPack!.publicationReady) gateFailures.unshift('Fact Pack publication gate is not ready.');
      if (!currentFactPack!.sources.length) gateFailures.unshift('Research is incomplete: the Fact Pack contains no sources.');
      await writeJsonFile(path.join(runDirectory, '08-visual-qa.json'), {publicationReady: currentFactPack!.publicationReady, researchComplete: currentFactPack!.sources.length > 0, qa: visualQa, visualFallbacks: report.visualFallbacks});
      if (gateFailures.length) {
        if (!options.draft) throw new Error(`Release quality gates failed:\n${gateFailures.map((failure) => `- ${failure}`).join('\n')}`);
        report.warnings.push(...gateFailures.map((failure) => `DRAFT bypass: ${failure}`));
      }
    report.releaseStatus = options.draft ? 'draft' : 'releaseCandidate';
      if (options.draft) report.draftLabel = currentFactPack!.publicationReady ? 'DRAFT — REVIEW REQUIRED' : 'DRAFT — NOT PUBLICATION READY';
      await writeJsonFile(path.join(runDirectory, '08-visual-qa.json'), {publicationReady: currentFactPack!.publicationReady, researchComplete: currentFactPack!.sources.length > 0, qa: visualQa, visualFallbacks: report.visualFallbacks, releaseStatus: report.releaseStatus, draftLabel: report.draftLabel});
      return visualQa;
    }});

    let renderedOutput: string | null = null;
    if (options.skipRender) {
      report.renderStatus = 'skipped';
      await recordSkippedStage({stage: '09 RENDER', runDirectory, report, message: 'Skipped by --skip-render; render can run later from saved Episode and VisualPlan checkpoints without APIs.', now, env, onStatus});
    } else {
      renderedOutput = await runFactoryStage({stage: '09 RENDER', runDirectory, report, now, env, onStatus, operation: async () => {
        const episodePath = path.join(runDirectory, '06-episode.json');
        const frameList = representativeFrames({durationInFrames: normalized!.durationInFrames, signatureSceneIndex: findSignatureSceneIndex(currentVisualPlan!), episodeSceneCount: currentEpisode!.scenes.length});
        const renderWithRemotion = dependencies.render ?? (async (input) => {
          const renderer = await import('../../scripts/render/episodeRenderer');
          return renderer.renderEpisode(input.episodePath, {outputLocation: input.outputPath, visualStrategies: input.strategies, onProgress: input.onProgress, quiet: true});
        });
        const output = await renderWithRemotion({episodePath, outputPath, strategies: visualStrategies});
        if (!(await isFile(output))) throw new Error(`Remotion render did not create the expected MP4: ${output}`);
        const videoInfo = await stat(output);
        if (videoInfo.size < 1024) throw new Error(`Remotion render output is unexpectedly small (${videoInfo.size} bytes).`);
        const renderStills = dependencies.renderStills ?? (async (input: {episodePath: string; outputDirectory: string; frames: readonly number[]; strategies: Record<string, ResolvedVisualStrategy>}) => {
          const renderer = await import('../../scripts/render/episodeRenderer');
          return renderer.renderEpisodeStillFrames({file: input.episodePath, outputDirectory: input.outputDirectory, frames: input.frames, visualStrategies: input.strategies});
        });
        const stills = await renderStills({episodePath, outputDirectory: qaDirectory, frames: frameList, strategies: visualStrategies});
        if (stills.length < 8 || stills.length > 12) throw new Error(`Still-frame QA expected 8–12 frames; received ${stills.length}.`);
        report.renderStatus = 'rendered';
        report.outputPath = output;
        await writeJsonFile(path.join(runDirectory, '08-visual-qa.json'), {publicationReady: currentFactPack!.publicationReady, researchComplete: currentFactPack!.sources.length > 0, qa: visualQa, visualFallbacks: report.visualFallbacks, releaseStatus: report.releaseStatus, draftLabel: report.draftLabel, stillFrames: stills});
        return output;
      }});
    }

    const claimTrace = buildClaimTrace(currentEpisode, currentFactPack);
    await writeJsonFile(path.join(runDirectory, 'claim-trace.json'), claimTrace);
    report.llmCallCount = usage.calls;
    report.tokenUsage = {inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, totalTokens: usage.totalTokens};
    await runFactoryStage({stage: '10 DELIVERY PACKAGE', runDirectory, report, now, env, onStatus, operation: async () => {
      const officialEpisodePath = path.join(root, FACTORY_PATHS.episodes, `${options.id}.json`);
      if (!(await isFile(officialEpisodePath)) || options.force) {
        await mkdir(path.dirname(officialEpisodePath), {recursive: true});
        await writeJsonFile(officialEpisodePath, currentEpisode);
      }
      const officialVisualPath = path.join(root, FACTORY_PATHS.generated, options.id, 'visual-plan.json');
      if (!(await isFile(officialVisualPath)) || options.force) await writeJsonFile(officialVisualPath, currentVisualPlan);
      const factPath = path.join(root, FACTORY_PATHS.research, options.id, 'fact-pack.json');
      if (!(await isFile(factPath)) || options.force) await writeJsonFile(factPath, currentFactPack);
      await writeDeliveryPackage({
        deliveryDirectory, episode: currentEpisode!, normalized: normalized!, factPack: currentFactPack!, visualPlan: currentVisualPlan!,
        report, claimTrace, strategy: resolveRenderStrategies(currentEpisode!, currentVisualPlan!), outputVideoPath: renderedOutput ?? undefined,
        outputPath: renderedOutput,
      });
      return deliveryDirectory;
    }});
    await writeFactoryReport(runDirectory, report);
    await writeJsonFile(path.join(deliveryDirectory, 'factory-report.json'), report);
    await writeJsonFile(path.join(deliveryDirectory, 'claim-trace.json'), claimTrace);
    const sourceMarkdown = await import('../research/researchPipeline').then(({renderSourcesMarkdown}) => renderSourcesMarkdown([...currentFactPack!.verifiedClaims, ...currentFactPack!.uncertainClaims, ...currentFactPack!.contradictedClaims], currentFactPack!.sources));
    await writeFile(path.join(runDirectory, 'sources.md'), sourceMarkdown, 'utf8');
    await writeFile(path.join(runDirectory, 'youtube.md'), await readFile(path.join(deliveryDirectory, 'youtube.md'), 'utf8'), 'utf8');

    return {runDirectory, deliveryDirectory, report, episode: currentEpisode, factPack: currentFactPack, visualPlan: currentVisualPlan, visualDiversity, visualStrategies, outputPath: renderedOutput};
  } catch (error) {
    report.llmCallCount = usage.calls;
    report.tokenUsage = {inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, totalTokens: usage.totalTokens};
    const failedStage = [...report.stages].reverse().find((stage) => stage.status === 'failed')?.stage;
    const firstUnfinished = FACTORY_STAGES.find((stage) => !report.stages.some((record) => record.stage === stage && ['succeeded', 'reused', 'failed', 'skipped'].includes(record.status)));
    if (firstUnfinished) {
      const afterFailure = failedStage ? FACTORY_STAGES.indexOf(failedStage) + 1 : FACTORY_STAGES.indexOf(firstUnfinished);
      for (const stage of FACTORY_STAGES.slice(afterFailure)) {
        if (!report.stages.some((record) => record.stage === stage && record.status !== 'started')) {
          await recordSkippedStage({stage, runDirectory, report, message: 'Pipeline stopped after an earlier stage failed.', now, env, onStatus});
        }
      }
    }
    await writeFactoryReport(runDirectory, report);
    throw error;
  }
}
