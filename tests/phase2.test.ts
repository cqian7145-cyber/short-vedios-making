import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from 'dotenv';
import { getRecraftConfigurationState, resolveRecraftConfig } from '../src/recraft/config';
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
import { createRecraftStyleFromReferences } from '../src/recraft/createStyle';
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
  assert.throws(() => resolveRecraftConfig({ RECRAFT_API_KEY: '', RECRAFT_STYLE_ID: 'present' }),
    /^Error: Missing required environment variable: RECRAFT_API_KEY$/);
  assert.throws(() => resolveRecraftConfig({ RECRAFT_API_KEY: 'present', RECRAFT_STYLE_ID: '' }),
    /^Error: Missing required environment variable: RECRAFT_STYLE_ID$/);
});

test('preflight and style status never print credentials or the style identifier', () => {
  const state = getRecraftConfigurationState({
    RECRAFT_API_KEY: 'api-secret-sentinel',
    RECRAFT_STYLE_ID: 'private-style-sentinel',
  });
  const output = `${formatPhase2Preflight({ deepseekConfigured: true, tavilyConfigured: true, recraft: state })}\n${formatRecraftStyleStatus(state)}`;
  assert.match(output, /Provider:\nRecraft/);
  assert.match(output, /Profile:\nMidnight Scientific Editorial v1/);
  assert.match(output, /Style: locked/);
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
    profileVersion: 'midnight-scientific-editorial-v1',
    profileName: 'Midnight Scientific Editorial v1', provider: 'recraft',
    styleConfigured: false, apiSmokePassed: true, assetCount: 6, semanticAccuracyScore: 12,
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
    embeddedTextRisk: 'low', semanticAccuracyScore: 12,
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

test('this suite uses an injected fetch and never requires real Recraft credentials', () => {
  const emptyEnv = getRecraftConfigurationState({ RECRAFT_API_KEY: '', RECRAFT_STYLE_ID: '' });
  assert.deepEqual(emptyEnv, { apiConfigured: false, styleConfigured: false });
  assert.equal(RecraftStyleProfileSchema.safeParse(RECRAFT_STYLE_PROFILE).success, true);
});
