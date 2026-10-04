export const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-flash';
export const MAX_NETWORK_RETRIES = 2;
export const ALLOWED_DEEPSEEK_MODELS = ['deepseek-flash', 'deepseek-v4-pro'] as const;
export type DeepSeekModel = (typeof ALLOWED_DEEPSEEK_MODELS)[number];

export type DeepSeekConfig = {apiKey: string; model: DeepSeekModel};

export function resolveDeepSeekConfig(options: {
  apiKey?: string;
  cliModel?: string;
  envModel?: string;
}): DeepSeekConfig {
  const apiKey = options.apiKey?.trim();
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is missing. Set it in your environment before generating an episode.');
  }
  const requestedModel = options.cliModel?.trim() || options.envModel?.trim() || DEFAULT_DEEPSEEK_MODEL;
  if (!ALLOWED_DEEPSEEK_MODELS.includes(requestedModel as DeepSeekModel)) {
    throw new Error(`Unsupported DeepSeek model "${requestedModel}". Choose ${ALLOWED_DEEPSEEK_MODELS.join(' or ')}.`);
  }
  return {apiKey, model: requestedModel as DeepSeekModel};
}
