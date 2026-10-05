import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from 'dotenv';
import {
  getRecraftConfigurationState, readLocalRecraftStyleState, resolveRecraftConfig, resolveRecraftStyleId,
  persistLocalRecraftStyleId,
} from '../src/recraft/config';
import { RecraftProviderError, safeRecraftError } from '../src/recraft/errors';
import { formatPhase2Preflight, formatRecraftStyleStatus } from '../src/recraft/status';
import {
  RecraftAssetManifestSchema,
  MidnightStyleAssessmentSchema,
  MidnightStyleValidationReportSchema,
  RecraftStyleValidationReportSchema,
} from '../src/recraft/schemas';
import { calculateStyleScore, createPendingStyleReport, styleLockEligible } from '../src/recraft/styleValidation';
import { mapSemanticRequestToProviderRequest, RecraftProvider, RECRAFT_GENERATION_ENDPOINT } from '../src/recraft/RecraftProvider';
import { RECRAFT_STYLE_PROFILE, RecraftStyleProfileSchema } from '../src/visual/recraftStyleProfile';
import { createAndPersistRecraftStyleFromReferences, createRecraftStyleFromReferences } from '../src/recraft/createStyle';
import { buildSemanticPrompt } from '../src/recraft/prompts';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('dotenv configuration is represented by flags only', () => {
  const env = parse('DEEPSEEK_API_KEY=dummy-deepseek\nTAVILY_API_KEY=dummy-tavily\nRECRAFT_API_KEY=dummy-recraft\nRECRAFT_STYLE_ID=dummy-style');
  const recraft = getRecraftConfigurationState(env);
  const output = formatPhase2Preflight({
    deepseekConfigured: Boolean(env.DEEPSEEK_API_KEY),
    tavilyConfigured: Boolean(env.TAVILY_API_KEY),
    recraft,
  });
  assert.match(output, /DeepSeek\s+✓ configured/);
  assert.match(output, /Tavily\s+✓ configured/);
  assert.match(output, /Recraft API\s+✓ configured/);
  assert.match(output, /Recraft Style\s+✓ configured/);
  assert.doesNotMatch(output, /dummy-/);
});

test('missing Recraft credentials produce exact variable-name errors', () => {
  const absentState = path.join(os.tmpdir(), 'recraft-config-test-absent-state.json');
  assert.throws(() => resolveRecraftConfig({ RECRAFT_API_KEY: '', RECRAFT_STYLE_ID: 'present' }, absentState),
    /^Error: Missing required environment variable: RECRAFT_API_KEY$/);
  assert.throws(() => resolveRecraftConfig({ RECRAFT_API_KEY: 'present', RECRAFT_STYLE_ID: '' }, absentState),
    /^Error: Missing required environment variable: RECRAFT_STYLE_ID$/);
});

test('preflight and style status never print credentials or the style identifier', () => {
  const state = getRecraftConfigurationState({
    RECRAFT_API_KEY: 'api-secret-sentinel',
    RECRAFT_STYLE_ID: 'private-style-sentinel',
  });
  const output = `${formatPhase2Preflight({ deepseekConfigured: true, tavilyConfigured: true, recraft: state })}\n${formatRecraftStyleStatus(state)}`;
  assert.match(output, /Provider:\nRecraft/);
  assert.match(output, /Profile:\nMidnight Scientific Editorial v2/);
  assert.match(output, /Style: configured/);
  assert.match(output, /Style source: env/);
  assert.doesNotMatch(output, /api-secret-sentinel|private-style-sentinel/);
});

test('profile schema is non-secret and matches the selected profile contract', () => {
  assert.equal(RecraftStyleProfileSchema.safeParse(RECRAFT_STYLE_PROFILE).success, true);
  assert.equal(RecraftStyleProfileSchema.safeParse({ ...RECRAFT_STYLE_PROFILE, styleId: 'not-allowed' }).success, false);
  assert.deepEqual(RECRAFT_STYLE_PROFILE.preferredUsage, ['objects', 'icons', 'characters']);
});

test('semantic image request maps to official Recraft generation fields and locked style', () => {
  const request = mapSemanticRequestToProviderRequest({
    subject: 'A clear subject',
    composition: 'Centered with broad empty margins',
    assetType: 'object',
    aspectRatio: '16:9',
  }, 'test-style-id');
  assert.equal(request.model, 'recraftv3');
  assert.equal(request.style_id, 'test-style-id');
  assert.equal(request.size, '16:9');
  assert.equal(request.n, 1);
  assert.equal(request.response_format, 'b64_json');
  assert.equal(request.image_format, 'png');
  assert.match(request.prompt, /NO EMBEDDED TEXT/);
  assert.match(request.prompt, /A clear subject/);
  assert.doesNotMatch(request.prompt, /electric blue|minimal line|saturated flat/i);
});

test('semantic prompts include explicit auction and branching ambiguity guards', () => {
  const auction = buildSemanticPrompt({
    subject: 'A single auction bidder paddle: a bidding card held by a bidder at auction.',
    physicalStructure: 'Flat rectangular card attached to one short straight handle.', viewpoint: 'Front-facing.',
    composition: 'One isolated object. No number or typography.',
    avoidConcepts: ['tennis racket', 'ping-pong paddle', 'magnifying glass', 'balance scale'], assetType: 'object',
  });
  const branching = buildSemanticPrompt({
    subject: 'An abstract decision-branching symbol.',
    visualRelationship: 'One straight input line enters from the left and splits into exactly three straight paths.',
    composition: 'Pure diagrammatic geometry; readable at small size.',
    avoidConcepts: ['tree', 'leaves', 'botanical branch', 'plant', 'trunk'], assetType: 'icon',
  });
  for (const term of ['tennis racket', 'ping-pong paddle', 'magnifying glass', 'balance scale']) assert.match(auction, new RegExp(term));
  for (const term of ['tree', 'leaves', 'botanical branch', 'plant', 'trunk']) assert.match(branching, new RegExp(term));
  assert.match(branching, /three straight paths/);
});

test('transparent background is rejected because the generation API has no documented parameter', () => {
  assert.throws(() => mapSemanticRequestToProviderRequest({
    subject: 'Isolated object', assetType: 'object', transparentBackground: true,
  }, 'test-style-id'), (error: unknown) => error instanceof RecraftProviderError && error.code === 'UNSUPPORTED_TRANSPARENCY');
});

test('provider makes one mocked request and returns decoded PNG bytes', async () => {
  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  let requestCount = 0;
  const pngBytes = Buffer.from('offline-mock-png');
  const mockFetch: typeof fetch = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    requestCount += 1;
    return new Response(JSON.stringify({ data: [{ b64_json: pngBytes.toString('base64') }] }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  };
  const provider = new RecraftProvider({ apiKey: 'api-secret-sentinel', styleId: 'style-id-sentinel' }, mockFetch);
  const result = await provider.generateImage({ subject: 'A machine', assetType: 'object' });
  const sent = JSON.parse(String(requestInit?.body)) as Record<string, unknown>;
  assert.equal(requestUrl, RECRAFT_GENERATION_ENDPOINT);
  assert.equal(requestCount, 1);
  assert.equal(sent.model, 'recraftv3');
  assert.equal(sent.style_id, 'style-id-sentinel');
  assert.equal(requestInit?.headers && new Headers(requestInit.headers).get('authorization'), 'Bearer api-secret-sentinel');
  assert.deepEqual(result.bytes, pngBytes);
  assert.equal(result.mimeType, 'image/png');
});

test('provider failures expose status without response body, key, or style ID', async () => {
  const mockFetch: typeof fetch = async () => new Response(
    JSON.stringify({ error: 'api-secret-sentinel style-id-sentinel' }), { status: 403 },
  );
  const provider = new RecraftProvider({ apiKey: 'api-secret-sentinel', styleId: 'style-id-sentinel' }, mockFetch);
  await assert.rejects(
    () => provider.generateImage({ subject: 'A machine', assetType: 'object' }),
    (error: unknown) => {
      const safe = safeRecraftError(error);
      assert.match(safe, /403/);
      assert.doesNotMatch(safe, /api-secret-sentinel|style-id-sentinel/);
      return true;
    },
  );
});

test('manifest schema accepts runtime metadata and excludes provider credentials', () => {
  const parsed = RecraftAssetManifestSchema.safeParse({
    schemaVersion: 'recraft-asset-manifest-v1',
    assets: [{
      id: '01-object', provider: 'recraft', assetType: 'object', subject: 'Steam engine', prompt: 'NO EMBEDDED TEXT. Steam engine',
      promptVersion: 'recraft-style-v1', profileVersion: 'recraft-v1',
      filePath: 'assets/style-validation/recraft-v1/01-object.png', width: 1024, height: 1024,
      createdAt: '2026-10-05T00:00:00.000Z',
    }],
  });
  assert.equal(parsed.success, true);
  assert.equal(RecraftAssetManifestSchema.safeParse({ schemaVersion: 'recraft-asset-manifest-v1', assets: [], styleId: 'secret' }).success, false);
});

test('new score includes semantic accuracy and blocks critical failures and missing human approval', () => {
  const report = createPendingStyleReport(['not run']);
  assert.equal(RecraftStyleValidationReportSchema.safeParse(report).success, true);
  assert.equal(report.overallScore, null);
  assert.equal(report.styleLocked, false);
  assert.equal(calculateStyleScore({
    styleConsistency: 18, semanticAccuracy: 19, objectClarity: 13, characterConsistency: 8,
    iconReadability: 8, darkBackgroundFit: 8, remotionCompatibility: 13,
  }), 87);
  assert.equal(styleLockEligible(87, true, 6, false, 0), false);
  assert.equal(styleLockEligible(87, true, 6, true, 1), false);
  assert.equal(styleLockEligible(87, true, 6, true, 0, true), true);
  assert.equal(styleLockEligible(87, true, 6, true, 0, false), false);
});

test('new report schema requires semantic accuracy and supports critical failure records', () => {
  const report = {
    profileVersion: 'midnight-scientific-editorial-v2',
    profileName: 'Midnight Scientific Editorial v2', provider: 'recraft',
    styleConfigured: false, apiSmokePassed: true, assetCount: 6, semanticAccuracyScore: 12,
    semanticReviewStatus: 'reviewed',
    criticalSemanticFailures: ['03-auction-paddle'],
    scoreBreakdown: {
      styleConsistency: 11, semanticAccuracy: 12, objectClarity: 11,
      characterConsistency: 8, iconReadability: 4, darkBackgroundFit: 8,
      remotionCompatibility: 9,
    },
    overallScore: 63, status: 'rejected', humanApproval: 'required',
    humanApprovalStatus: 'pending', warnings: [], styleLocked: false,
  };
  assert.equal(MidnightStyleValidationReportSchema.safeParse(report).success, true);
  assert.equal(MidnightStyleValidationReportSchema.safeParse({ ...report, semanticAccuracyScore: undefined }).success, false);
  assert.equal(MidnightStyleAssessmentSchema.safeParse({
    reviewType: 'editorial-heuristic', reviewer: 'mock', humanApprovalStatus: 'pending',
    embeddedTextRisk: 'low', semanticReviewStatus: 'reviewed', semanticAccuracyScore: 12,
    criticalSemanticFailures: ['03-auction-paddle'],
    scoreBreakdown: report.scoreBreakdown, warnings: [], notes: [],
  }).success, true);
});

test('custom style creation sends local references to the official multipart API without logging its id', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'recraft-style-test-'));
  try {
    const images = await Promise.all(Array.from({ length: 6 }, async (_, index) => {
      const file = path.join(directory, `${index}.png`);
      await writeFile(file, Buffer.from(`png-${index}`));
      return file;
    }));
    let requestUrl = '';
    let requestHeaders: Headers | undefined;
    let requestBody: FormData | undefined;
    const mockFetch: typeof fetch = async (input, init) => {
      requestUrl = String(input);
      requestHeaders = new Headers(init?.headers);
      requestBody = init?.body as FormData;
      return new Response(JSON.stringify({ id: 'private-style-sentinel', model: 'recraftv3' }), { status: 200 });
    };
    const id = await createRecraftStyleFromReferences('api-key-sentinel', images, mockFetch);
    assert.equal(id, 'private-style-sentinel');
    assert.equal(requestUrl, 'https://external.api.recraft.ai/v1/styles');
    assert.equal(requestHeaders?.get('authorization'), 'Bearer api-key-sentinel');
    assert.equal(requestBody?.get('model'), 'recraftv3');
    assert.equal(requestBody?.get('style'), 'digital_illustration');
    assert.equal(requestBody?.get('match'), 'regular');
    for (let index = 1; index <= 6; index += 1) assert.ok(requestBody?.get(`file${index}`));
    await assert.rejects(
      () => createRecraftStyleFromReferences('api-key-sentinel', images, async () => new Response(
        JSON.stringify({ error: 'api-key-sentinel private-style-sentinel' }), { status: 403 },
      )),
      /^Error: Recraft custom style creation failed \(HTTP 403\)\.$/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('successful style creation persists its identifier in ignored local state without logging it', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'recraft-style-state-'));
  try {
    const images = await Promise.all(Array.from({ length: 6 }, async (_, index) => {
      const file = path.join(directory, `${index}.png`);
      await writeFile(file, Buffer.from(`png-${index}`));
      return file;
    }));
    const statePath = path.join(directory, '.recraft-style.local.json');
    const mockFetch: typeof fetch = async () => new Response(JSON.stringify({ id: 'private-style-state-sentinel' }), { status: 200 });
    const id = await createAndPersistRecraftStyleFromReferences('api-secret', images, statePath, mockFetch);
    assert.equal(id, 'private-style-state-sentinel');
    const state = readLocalRecraftStyleState(statePath);
    assert.equal(state?.configured, true);
    assert.equal(state?.profileVersion, 'recraft-v1');
    assert.equal(state?.styleId, id);
    assert.ok(state?.createdAt);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('environment style ID overrides valid local state and local state is the fallback', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'recraft-style-priority-'));
  const statePath = path.join(directory, '.recraft-style.local.json');
  try {
    persistLocalRecraftStyleId('private-local-style-sentinel', statePath, '2026-10-05T00:00:00.000Z');
    assert.deepEqual(resolveRecraftStyleId({ RECRAFT_STYLE_ID: 'private-env-style-sentinel' }, statePath), {
      styleId: 'private-env-style-sentinel', source: 'env',
    });
    assert.deepEqual(resolveRecraftStyleId({ RECRAFT_STYLE_ID: '' }, statePath), {
      styleId: 'private-local-style-sentinel', source: 'local-state',
    });
    assert.equal(getRecraftConfigurationState({ RECRAFT_API_KEY: 'key', RECRAFT_STYLE_ID: '' }, statePath).styleSource, 'local-state');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('malformed local style state is rejected without exposing contents', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'recraft-style-malformed-'));
  const statePath = path.join(directory, '.recraft-style.local.json');
  try {
    await writeFile(statePath, '{"styleId":"private-style-sentinel",');
    assert.throws(() => resolveRecraftStyleId({ RECRAFT_STYLE_ID: '' }, statePath), (error: unknown) => {
      assert.match(error instanceof Error ? error.message : '', /malformed/);
      assert.doesNotMatch(error instanceof Error ? error.message : '', /private-style-sentinel/);
      return true;
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('local style status reports its source without logging the identifier', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'recraft-style-status-'));
  const statePath = path.join(directory, '.recraft-style.local.json');
  try {
    persistLocalRecraftStyleId('private-local-status-sentinel', statePath, '2026-10-05T00:00:00.000Z');
    const state = getRecraftConfigurationState({ RECRAFT_API_KEY: 'api-sentinel', RECRAFT_STYLE_ID: '' }, statePath);
    const output = formatRecraftStyleStatus(state);
    assert.match(output, /Style: configured/);
    assert.match(output, /Style source: local-state/);
    assert.doesNotMatch(output, /private-local-status-sentinel|api-sentinel/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('this suite uses an injected fetch and never requires real Recraft credentials', () => {
  const absentState = path.join(os.tmpdir(), 'recraft-config-test-absent-state.json');
  const emptyEnv = getRecraftConfigurationState({ RECRAFT_API_KEY: '', RECRAFT_STYLE_ID: '' }, absentState);
  assert.deepEqual(emptyEnv, { apiConfigured: false, styleConfigured: false, styleSource: 'missing' });
  assert.equal(RecraftStyleProfileSchema.safeParse(RECRAFT_STYLE_PROFILE).success, true);
});
