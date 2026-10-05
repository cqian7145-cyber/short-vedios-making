import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { LocalRecraftStyleStateSchema } from './schemas';

export type RecraftEnvironment = {
  RECRAFT_API_KEY?: string;
  RECRAFT_STYLE_ID?: string;
};

export type RecraftStyleIdSource = 'env' | 'local-state' | 'missing';

export type RecraftConfigurationState = {
  apiConfigured: boolean;
  styleConfigured: boolean;
  styleSource: RecraftStyleIdSource;
};

export type RecraftConfig = {
  apiKey: string;
  styleId: string;
  styleIdSource?: Exclude<RecraftStyleIdSource, 'missing'>;
};

export type RecraftStyleResolution = {
  styleId: string;
  source: Exclude<RecraftStyleIdSource, 'missing'>;
};

export const LOCAL_RECRAFT_STYLE_STATE_PATH = path.resolve('.recraft-style.local.json');

export function resolveRecraftApiKey(env: RecraftEnvironment = process.env): string {
  const apiKey = env.RECRAFT_API_KEY?.trim();
  if (!apiKey) throw new Error('Missing required environment variable: RECRAFT_API_KEY');
  return apiKey;
}

export function readLocalRecraftStyleState(filePath = LOCAL_RECRAFT_STYLE_STATE_PATH) {
  let contents: string;
  try {
    contents = readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return undefined;
    throw new Error('Could not read local Recraft style state.');
  }
  let json: unknown;
  try {
    json = JSON.parse(contents);
  } catch {
    throw new Error('Local Recraft style state is malformed; it was rejected without using its contents.');
  }
  const parsed = LocalRecraftStyleStateSchema.safeParse(json);
  if (!parsed.success) throw new Error('Local Recraft style state is invalid; it was rejected without using its contents.');
  return parsed.data;
}

export function resolveRecraftStyleId(
  env: RecraftEnvironment = process.env,
  filePath = LOCAL_RECRAFT_STYLE_STATE_PATH,
): RecraftStyleResolution | undefined {
  const envStyleId = env.RECRAFT_STYLE_ID?.trim();
  if (envStyleId) return { styleId: envStyleId, source: 'env' };
  const local = readLocalRecraftStyleState(filePath);
  return local ? { styleId: local.styleId, source: 'local-state' } : undefined;
}

export function persistLocalRecraftStyleId(
  styleId: string,
  filePath = LOCAL_RECRAFT_STYLE_STATE_PATH,
  createdAt = new Date().toISOString(),
): void {
  const state = LocalRecraftStyleStateSchema.parse({
    profileVersion: 'recraft-v1', configured: true, createdAt, styleId,
  });
  const target = path.resolve(filePath);
  const temporary = `${target}.tmp`;
  try {
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    renameSync(temporary, target);
  } catch {
    rmSync(temporary, { force: true });
    throw new Error('Could not persist local Recraft style state.');
  }
}

export function getRecraftConfigurationState(
  env: RecraftEnvironment = process.env,
  filePath = LOCAL_RECRAFT_STYLE_STATE_PATH,
): RecraftConfigurationState {
  const resolution = resolveRecraftStyleId(env, filePath);
  return {
    apiConfigured: Boolean(env.RECRAFT_API_KEY?.trim()),
    styleConfigured: Boolean(resolution),
    styleSource: resolution?.source ?? 'missing',
  };
}

export function resolveRecraftConfig(
  env: RecraftEnvironment = process.env,
  filePath = LOCAL_RECRAFT_STYLE_STATE_PATH,
): RecraftConfig {
  const apiKey = resolveRecraftApiKey(env);
  const styleResolution = resolveRecraftStyleId(env, filePath);
  if (!styleResolution) throw new Error('Missing required environment variable: RECRAFT_STYLE_ID');
  return { apiKey, styleId: styleResolution.styleId, styleIdSource: styleResolution.source };
}
