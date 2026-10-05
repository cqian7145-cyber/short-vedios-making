import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from 'dotenv';
import {
  getRecraftConfigurationState,
  resolveRecraftConfig,
} from '../src/recraft/config';
import { formatPhase2Preflight, formatRecraftStyleStatus } from '../src/recraft/status';
import {
  RECRAFT_STYLE_PROFILE,
  RecraftStyleProfileSchema,
} from '../src/visual/recraftStyleProfile';

test('dotenv values resolve to configuration flags without returning them in status', () => {
  const env = parse('DEEPSEEK_API_KEY=dummy-deepseek\nTAVILY_API_KEY=dummy-tavily\nRECRAFT_API_KEY=dummy-recraft');
  const state = getRecraftConfigurationState(env);
  const output = formatPhase2Preflight({
    deepseekConfigured: Boolean(env.DEEPSEEK_API_KEY),
    tavilyConfigured: Boolean(env.TAVILY_API_KEY),
    recraft: state,
  });

  assert.match(output, /DeepSeek\s+✓ configured/);
  assert.match(output, /Tavily\s+✓ configured/);
  assert.match(output, /Recraft API\s+✓ configured/);
  assert.doesNotMatch(output, /dummy-/);
  assert.equal(state.styleStatus, 'unlocked');
});

test('missing Recraft key fails clearly without echoing the value', () => {
  assert.throws(
    () => resolveRecraftConfig({ RECRAFT_API_KEY: '', RECRAFT_STYLE_ID: '' }),
    /set RECRAFT_API_KEY in your local \.env file/,
  );
});

test('missing style ID is allowed while unlocked and can be required explicitly', () => {
  const config = resolveRecraftConfig({ RECRAFT_API_KEY: 'secret-value', RECRAFT_STYLE_ID: '' });
  assert.equal(config.styleStatus, 'unlocked');
  assert.equal(config.styleId, undefined);
  assert.throws(
    () => resolveRecraftConfig(
      { RECRAFT_API_KEY: 'secret-value', RECRAFT_STYLE_ID: '' },
      { requireStyleId: true },
    ),
    /style is not locked/,
  );
});

test('configured style ID only affects locked state; status never reveals configuration values', () => {
  const state = getRecraftConfigurationState({
    RECRAFT_API_KEY: 'api-secret-example',
    RECRAFT_STYLE_ID: 'style-secret-example',
  });
  const output = formatRecraftStyleStatus(state);

  assert.equal(state.styleStatus, 'locked');
  assert.match(output, /API: configured/);
  assert.match(output, /Style: locked/);
  assert.doesNotMatch(output, /api-secret-example|style-secret-example/);
});

test('non-secret profile validates and rejects secret or unsupported fields', () => {
  assert.equal(RecraftStyleProfileSchema.safeParse(RECRAFT_STYLE_PROFILE).success, true);
  assert.equal(RecraftStyleProfileSchema.safeParse({
    ...RECRAFT_STYLE_PROFILE,
    styleId: 'must-not-be-stored-here',
  }).success, false);
  assert.equal(RecraftStyleProfileSchema.safeParse({
    ...RECRAFT_STYLE_PROFILE,
    visualLanguage: ['cyberpunk'],
  }).success, false);
});
