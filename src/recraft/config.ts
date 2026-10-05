export type RecraftEnvironment = {
  RECRAFT_API_KEY?: string;
  RECRAFT_STYLE_ID?: string;
};

export type RecraftConfigurationState = {
  apiConfigured: boolean;
  styleConfigured: boolean;
  styleStatus: 'locked' | 'unlocked';
};

export type RecraftConfig = {
  apiKey: string;
  styleId?: string;
  styleStatus: 'locked' | 'unlocked';
};

export function getRecraftConfigurationState(
  env: RecraftEnvironment = process.env,
): RecraftConfigurationState {
  const apiConfigured = Boolean(env.RECRAFT_API_KEY?.trim());
  const styleConfigured = Boolean(env.RECRAFT_STYLE_ID?.trim());

  return {
    apiConfigured,
    styleConfigured,
    styleStatus: styleConfigured ? 'locked' : 'unlocked',
  };
}

export function resolveRecraftConfig(
  env: RecraftEnvironment = process.env,
  options: { requireStyleId?: boolean } = {},
): RecraftConfig {
  const apiKey = env.RECRAFT_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Recraft is not configured: set RECRAFT_API_KEY in your local .env file.');
  }

  const styleId = env.RECRAFT_STYLE_ID?.trim();
  if (options.requireStyleId && !styleId) {
    throw new Error('Recraft style is not locked: set RECRAFT_STYLE_ID after style evaluation.');
  }

  return {
    apiKey,
    ...(styleId ? { styleId } : {}),
    styleStatus: styleId ? 'locked' : 'unlocked',
  };
}
