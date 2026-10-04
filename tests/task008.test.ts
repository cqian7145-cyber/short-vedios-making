import test from 'node:test';
import assert from 'node:assert/strict';
import {access, copyFile, mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {parseFactoryArgs} from '../src/factory/parseFactoryArgs';
import {runFactory} from '../src/factory/factory';

test('factory CLI accepts topic, id, duration and resume controls with bounded duration', () => {
  const parsed = parseFactoryArgs(['--topic', 'A counterintuitive topic', '--id', 'factory-test', '--duration', '150', '--resume', '--skip-render']);
  assert.equal(parsed.topic, 'A counterintuitive topic');
  assert.equal(parsed.id, 'factory-test');
  assert.equal(parsed.durationSeconds, 150);
  assert.equal(parsed.durationWasProvided, true);
  assert.equal(parsed.resume, true);
  assert.equal(parsed.skipRender, true);
  assert.throws(() => parseFactoryArgs(['--topic', 'Topic', '--id', 'factory-test', '--duration', '29']), /duration must be an integer/);
  assert.throws(() => parseFactoryArgs(['--topic', 'Topic', '--id', 'Bad_ID']), /lowercase kebab-case/);
});

test('factory refuses occupied fresh-run output before mutating checkpoints', async (t) => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'vibe-task008-collision-'));
  t.after(async () => rm(projectRoot, {recursive: true, force: true}));
  await mkdir(path.join(projectRoot, 'output'), {recursive: true});
  await writeFile(path.join(projectRoot, 'output', 'occupied-run.mp4'), 'existing user output');
  await assert.rejects(runFactory({id: 'occupied-run', topic: 'A fresh topic'}, {projectRoot, env: {}}), /Factory output already exists/);
  await assert.rejects(access(path.join(projectRoot, 'runs', 'occupied-run', 'factory-config.json')));
});

test('factory reuses Task007 Fact Pack, brief, Episode and VisualPlan without API calls', async (t) => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'vibe-task008-reuse-'));
  t.after(async () => rm(projectRoot, {recursive: true, force: true}));
  const sourceRoot = process.cwd();
  const destinations = [
    ['research/paradox-of-choice/fact-pack.json', 'research/paradox-of-choice/fact-pack.json'],
    ['research/paradox-of-choice/content-brief.json', 'research/paradox-of-choice/content-brief.json'],
    ['episodes/generated/paradox-of-choice.json', 'episodes/generated/paradox-of-choice.json'],
    ['generated/paradox-of-choice/visual-plan.json', 'generated/paradox-of-choice/visual-plan.json'],
  ] as const;
  for (const [source, destination] of destinations) {
    const output = path.join(projectRoot, destination);
    const {mkdir} = await import('node:fs/promises');
    await mkdir(path.dirname(output), {recursive: true});
    await copyFile(path.join(sourceRoot, source), output);
  }
  const factPack = JSON.parse(await readFile(path.join(projectRoot, destinations[0][1]), 'utf8')) as {topic: string; publicationReady: boolean};
  assert.equal(factPack.publicationReady, true);

  const result = await runFactory({id: 'paradox-of-choice', topic: factPack.topic, resume: true, skipRender: true}, {
    projectRoot,
    env: {},
    llm: {model: 'must-not-be-called', generateStructured: async () => {throw new Error('Unexpected DeepSeek call during Task007 artifact reuse.');}},
    research: {search: async () => {throw new Error('Unexpected Tavily call during Task007 artifact reuse.');}},
    now: () => new Date('2026-10-04T00:00:00.000Z'),
  });

  assert.equal(result.report.publicationReady, true);
  assert.equal(result.report.renderStatus, 'skipped');
  assert.equal(result.report.researchProvider, 'tavily (Task007 checkpoint)');
  assert.equal(result.report.stages.some((stage) => stage.stage === '03 RESEARCH PLAN' && stage.status === 'skipped'), true);
  assert.equal(result.report.stages.some((stage) => stage.stage === '04 RESEARCH' && stage.status === 'skipped'), true);
  assert.equal(result.report.stages.some((stage) => stage.stage === '05 FACT PACK' && stage.status === 'reused'), true);
  assert.equal(result.report.stages.some((stage) => stage.stage === '06 VERIFIED EPISODE' && stage.status === 'reused'), true);
  assert.equal(result.report.stages.some((stage) => stage.stage === '07 VISUAL PLAN' && stage.status === 'reused'), true);
  const deliveredTrace = JSON.parse(await readFile(path.join(result.deliveryDirectory, 'claim-trace.json'), 'utf8')) as {scenes: {claimIds: string[]}[]};
  assert.equal(deliveredTrace.scenes.length, result.episode.scenes.length);
  assert.ok(result.report.llmCallCount === 0);
  assert.equal(result.report.researchQueryCount, 0);
  assert.ok(result.report.verifiedClaimCount > 0);
});
