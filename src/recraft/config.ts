export type RecraftEnvironment = {
  RECRAFT_API_KEY?: string;
  RECRAFT_STYLE_ID?: string;
};

export type RecraftConfigurationState = {
  apiConfigured: boolean;
  styleConfigured: boolean;
};

export type RecraftConfig = {
  apiKey: string;
  styleId: string;
};

export function getRecraftConfigurationState(
  env: RecraftEnvironment = process.env,
): RecraftConfigurationState {
  return {
    apiConfigured: Boolean(env.RECRAFT_API_KEY?.trim()),
    styleConfigured: Boolean(env.RECRAFT_STYLE_ID?.trim()),
  };
}

export function resolveRecraftConfig(
  env: RecraftEnvironment = process.env,
): RecraftConfig {
  const apiKey = env.RECRAFT_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing required environment variable: RECRAFT_API_KEY');
  }

  const styleId = env.RECRAFT_STYLE_ID?.trim();
  if (!styleId) {
    throw new Error('Missing required environment variable: RECRAFT_STYLE_ID');
  }

  return { apiKey, styleId };
}
