import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {MockLLMProvider} from '../src/ai/MockLLMProvider';
import {ContentBriefSchema} from '../src/ai/contentBriefSchema';
import {resolveDeepSeekConfig} from '../src/ai/deepseek/config';
import {DeepSeekProvider} from '../src/ai/deepseek/DeepSeekProvider';
import {generateEpisode, researchWarnings} from '../src/ai/pipeline';
import {MAX_BRIEF_REPAIR_ATTEMPTS, MAX_REPAIR_ATTEMPTS} from '../src/ai/generationConfig';
import {parseGenerationArgs} from '../scripts/generation-cli';

const fixtureDir = path.resolve('tests/fixtures');
const briefJson = readFileSync(path.join(fixtureDir, 'content-brief.json'), 'utf8');
const episodeJson = readFileSync(path.join(fixtureDir, 'generated-episode.json'), 'utf8');
const invalidEpisodeJson = readFileSync(path.join(fixtureDir, 'invalid-episode.json'), 'utf8');

const makeProvider = (episodeResponses = [episodeJson], briefResponses = [briefJson]) => new MockLLMProvider({
  content_brief_v1: [...briefResponses],
  episode_v1: [...episodeResponses],
});

const makeRoots = async (t: test.TestContext) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'vibe-episode-test-'));
  t.after(async () => rm(root, {recursive: true, force: true}));
  return {generatedRoot: path.join(root, 'generated'), episodesRoot: path.join(root, 'episodes')};
};

const options = () => ({topic: 'Why can more choices make decisions worse?', id: 'choice-overload', durationSeconds: 60});

test('ContentBrief contract accepts structured concept copy and research flags', () => {
  const brief = ContentBriefSchema.parse(JSON.parse(briefJson));
  assert.equal(brief.suggestedSceneFlow.length, 8);
  assert.equal(brief.riskFlags[0].needsResearch, true);
  assert.match(researchWarnings(brief)[0], /Research required before publication/);
});

test('missing API key fails early and model precedence is CLI, environment, default', () => {
  assert.throws(() => resolveDeepSeekConfig({apiKey: ''}), /DEEPSEEK_API_KEY is missing/);
  assert.equal(resolveDeepSeekConfig({apiKey: 'test-key'}).model, 'deepseek-flash');
  assert.equal(resolveDeepSeekConfig({apiKey: 'test-key', envModel: 'deepseek-v4-pro'}).model, 'deepseek-v4-pro');
  assert.equal(resolveDeepSeekConfig({apiKey: 'test-key', cliModel: 'deepseek-flash', envModel: 'deepseek-v4-pro'}).model, 'deepseek-flash');
  assert.throws(() => resolveDeepSeekConfig({apiKey: 'test-key', cliModel: 'deepseek-chat'}), /Unsupported DeepSeek model/);
});

test('CLI parses topic, duration, model, dry-run, force and derives an ID', () => {
  const parsed = parseGenerationArgs(['--topic', 'Why do small choices matter?', '--duration', '60', '--model', 'deepseek-v4-pro', '--dry-run', '--force']);
  assert.equal(parsed.id, 'why-do-small-choices-matter');
  assert.equal(parsed.durationSeconds, 60);
  assert.equal(parsed.model, 'deepseek-v4-pro');
  assert.equal(parsed.dryRun, true);
  assert.equal(parsed.force, true);
  assert.throws(() => parseGenerationArgs(['--unknown', 'x']), /Unknown option/);
});

test('mock provider generates a validated episode and saves artifacts without API access', async (t) => {
  const roots = await makeRoots(t);
  const provider = makeProvider();
  const result = await generateEpisode({...options(), force: false}, provider, roots);
  assert.equal(result.episode.id, 'choice-overload');
  assert.equal(result.episode.metadata?.topic, result.brief.topic);
  assert.equal(result.report.status, 'validated');
  assert.equal(result.report.sceneCount, 7);
  assert.equal(result.report.validationAttempts, 1);
  assert.equal(result.report.repairAttempts, 0);
  assert.equal(result.report.briefValidationAttempts, 1);
  assert.equal(result.report.briefRepairAttempts, 0);
  assert.equal(result.report.needsResearch, true);
  assert.equal(result.report.tokenUsage.totalTokens, 64);
  assert.deepEqual(provider.calls.map((call) => call.schemaName), ['content_brief_v1', 'episode_v1']);
  for (const file of [result.paths.briefPath, result.paths.rawEpisodePath, result.paths.validatedEpisodePath, result.paths.reportPath, result.paths.episodePath]) {
    await readFile(file, 'utf8');
  }
});

test('invalid episode is repaired with bounded, path-specific feedback', async (t) => {
  const roots = await makeRoots(t);
  const provider = makeProvider([invalidEpisodeJson, episodeJson]);
  const result = await generateEpisode(options(), provider, roots);
  assert.equal(result.report.validationAttempts, 2);
  assert.equal(result.report.repairAttempts, 1);
  assert.equal(result.report.briefValidationAttempts, 1);
  assert.equal(result.report.briefRepairAttempts, 0);
  assert.match(provider.calls[2].input, /scenes\[0\]\.type/);
});

test('overlong ContentBrief is repaired locally before episode generation', async (t) => {
  const roots = await makeRoots(t);
  const invalidBrief = JSON.parse(briefJson) as Record<string, unknown>;
  invalidBrief.visualMetaphor = 'x'.repeat(527);
  const provider = makeProvider([episodeJson], [JSON.stringify(invalidBrief), briefJson]);
  const result = await generateEpisode(options(), provider, roots);

  assert.equal(result.report.briefValidationAttempts, 2);
  assert.equal(result.report.briefRepairAttempts, 1);
  assert.equal(result.report.validationAttempts, 1);
  assert.equal(result.report.repairAttempts, 0);
  assert.deepEqual(provider.calls.map((call) => call.schemaName), ['content_brief_v1', 'content_brief_v1', 'episode_v1']);
  assert.match(provider.calls[1].input, /visualMetaphor: maximum 400 characters; received 527/);
  assert.equal(provider.calls[1].instructions.includes('Fix only schema/validation violations'), true);
  assert.equal(result.brief.visualMetaphor.length <= 400, true);
});

test('ContentBrief repair stops after exactly two repairs and writes separate failed counters', async (t) => {
  const roots = await makeRoots(t);
  const invalidBrief = JSON.parse(briefJson) as Record<string, unknown>;
  invalidBrief.visualMetaphor = 'x'.repeat(527);
  const provider = makeProvider([episodeJson], [JSON.stringify(invalidBrief), JSON.stringify(invalidBrief), JSON.stringify(invalidBrief)]);

  await assert.rejects(generateEpisode(options(), provider, roots), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /ContentBrief validation failed after 3 attempt\(s\)/);
    assert.match(error.message, /visualMetaphor: maximum 400 characters; received 527/);
    assert.doesNotMatch(error.message, /"code"\s*:\s*"too_big"/);
    return true;
  });
  assert.equal(MAX_BRIEF_REPAIR_ATTEMPTS, 2);
  assert.equal(provider.calls.length, 3);
  assert.deepEqual(provider.calls.map((call) => call.schemaName), ['content_brief_v1', 'content_brief_v1', 'content_brief_v1']);
  const report = JSON.parse(await readFile(path.join(roots.generatedRoot!, 'choice-overload', 'generation-report.json'), 'utf8')) as Record<string, unknown>;
  assert.equal(report.briefValidationAttempts, 3);
  assert.equal(report.briefRepairAttempts, 2);
  assert.equal(report.validationAttempts, 0);
  assert.equal(report.repairAttempts, 0);
  assert.equal(report.status, 'failed');
});

test('episode repair loop stops after exactly two repairs', async (t) => {
  const roots = await makeRoots(t);
  const provider = makeProvider([invalidEpisodeJson, invalidEpisodeJson, invalidEpisodeJson]);
  await assert.rejects(generateEpisode(options(), provider, roots), /failed local validation after 3 attempt/);
  assert.equal(MAX_REPAIR_ATTEMPTS, 2);
  assert.equal(provider.calls.length, 4);
  const report = JSON.parse(await readFile(path.join(roots.generatedRoot!, 'choice-overload', 'generation-report.json'), 'utf8')) as {repairAttempts: number; status: string};
  assert.equal(report.repairAttempts, 2);
  assert.equal(report.status, 'failed');
});

test('existing episode is protected before model calls; --force permits replacement', async (t) => {
  const roots = await makeRoots(t);
  const file = path.join(roots.episodesRoot!, 'choice-overload.json');
  await mkdir(roots.episodesRoot!, {recursive: true});
  await writeFile(file, '{"manual":true}\n', 'utf8');
  const unusedProvider = makeProvider();
  await assert.rejects(generateEpisode(options(), unusedProvider, roots), /Refusing to overwrite/);
  assert.equal(unusedProvider.calls.length, 0);
  const result = await generateEpisode({...options(), force: true}, makeProvider(), roots);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).id, 'choice-overload');
  assert.equal(result.report.status, 'validated');
});

test('DeepSeek Responses client retries transient HTTP failures twice then returns structured JSON', async () => {
  let calls = 0;
  const waits: number[] = [];
  let capturedRequest: Record<string, unknown> | undefined;
  const fetcher: typeof fetch = async () => {
    calls += 1;
    if (calls < 3) return new Response(JSON.stringify({error: {message: 'temporary service error'}}), {status: 503});
    return new Response(JSON.stringify({
      id: 'response-test', object: 'response', created_at: 1, status: 'completed', model: 'deepseek-flash',
      output: [{id: 'message-test', type: 'message', status: 'completed', role: 'assistant', content: [{type: 'output_text', text: '{"ok":true}'}]}],
      usage: {input_tokens: 2, output_tokens: 3, total_tokens: 5, input_tokens_details: {cached_tokens: 0}, output_tokens_details: {reasoning_tokens: 0}},
      error: null, incomplete_details: null, store: false, parallel_tool_calls: true, previous_response_id: null,
    }), {status: 200, headers: {'content-type': 'application/json'}});
  };
  const provider = new DeepSeekProvider({apiKey: 'unit-test-secret', model: 'deepseek-flash'}, {
    fetch: async (url, init) => {
      if (init?.body) capturedRequest = JSON.parse(String(init.body)) as Record<string, unknown>;
      return fetcher(url, init);
    },
    baseURL: 'https://deepseek.test', sleep: async (ms) => { waits.push(ms); },
  });
  const result = await provider.generateStructured({schemaName: 'fixture', schema: {type: 'object'}, instructions: 'JSON only', input: 'fixture', maxOutputTokens: 50});
  assert.equal(result.text, '{"ok":true}');
  assert.equal(result.usage?.totalTokens, 5);
  assert.equal(calls, 3);
  assert.deepEqual(waits, [700, 1400]);
  assert.equal(capturedRequest?.model, 'deepseek-flash');
  assert.equal((capturedRequest?.text as {format: {type: string}}).format.type, 'json_schema');
  assert.equal(capturedRequest?.max_output_tokens, 50);
});

test('network retries stop after two retries', async () => {
  let calls = 0;
  const waits: number[] = [];
  const provider = new DeepSeekProvider({apiKey: 'unit-test-secret', model: 'deepseek-flash'}, {
    baseURL: 'https://deepseek.test',
    fetch: async () => {
      calls += 1;
      return new Response(JSON.stringify({error: {message: 'temporary unavailable'}}), {status: 503});
    },
    sleep: async (ms) => { waits.push(ms); },
  });
  await assert.rejects(provider.generateStructured({schemaName: 'fixture', schema: {type: 'object'}, instructions: 'JSON only', input: 'fixture', maxOutputTokens: 50}), /HTTP 503/);
  assert.equal(calls, 3);
  assert.deepEqual(waits, [700, 1400]);
});

test('API authentication errors are concise and redact key-like credentials', async () => {
  const secret = 'sk-test-do-not-print';
  const fetcher: typeof fetch = async () => new Response(JSON.stringify({error: {message: `invalid key ${secret}`}}), {status: 401});
  const provider = new DeepSeekProvider({apiKey: secret, model: 'deepseek-flash'}, {fetch: fetcher, baseURL: 'https://deepseek.test'});
  await assert.rejects(
    provider.generateStructured({schemaName: 'fixture', schema: {type: 'object'}, instructions: 'JSON only', input: 'fixture', maxOutputTokens: 50}),
    (error: unknown) => error instanceof Error && error.message.includes('HTTP 401') && !error.message.includes(secret),
  );
});
