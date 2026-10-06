import { RecraftConfig } from './config';
import { RecraftProviderError } from './errors';
import { RecraftApiResponseSchema, RecraftImageRequestSchema } from './schemas';
import { buildSemanticPrompt } from './prompts';
import {
  GeneratedRecraftImage,
  RecraftImageRequest,
  RecraftProviderRequest,
} from './types';

export const RECRAFT_GENERATION_ENDPOINT = 'https://external.api.recraft.ai/v1/images/generations';
export const RECRAFT_MODEL = 'recraftv3' as const;
const STYLE_PROMPT_PREFIX = [
  'Use the configured Recraft Style as the visual authority.',
  'Generate a clean editorial asset with a clear silhouette, strong visual hierarchy,',
  'large negative space, restrained detail, and suitability for dark-background compositing.',
  'NO EMBEDDED TEXT. Subject and composition instructions define what to show; do not override the configured Style.',
].join(' ');

function sanitizeProviderMessage(value: string, apiKey: string, styleId: string): string {
  return value
    .split(apiKey).join('[redacted]')
    .split(styleId).join('[redacted]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[identifier]')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, 240);
}

export function mapSemanticRequestToProviderRequest(
  request: RecraftImageRequest,
  styleId: string,
): RecraftProviderRequest {
  const parsed = RecraftImageRequestSchema.safeParse(request);
  if (!parsed.success) {
    throw new RecraftProviderError('Invalid semantic image request.', { code: 'INVALID_REQUEST' });
  }
  if (parsed.data.transparentBackground) {
    throw new RecraftProviderError(
      'Transparent background is not an officially documented generation parameter; request a quiet background instead.',
      { code: 'UNSUPPORTED_TRANSPARENCY' },
    );
  }

  const prompt = parsed.data.preparedPrompt
    ? `${parsed.data.preparedPrompt} NO EMBEDDED TEXT, numbers, or logos.`
    : `${STYLE_PROMPT_PREFIX} ${buildSemanticPrompt(parsed.data)} NO EMBEDDED TEXT, numbers, or logos.`;
  if (prompt.length > 1000) throw new RecraftProviderError('Prompt exceeds the Recraft API limit of 1000 characters.', {code:'INVALID_REQUEST'});
  return {
    prompt,
    model: RECRAFT_MODEL,
    style_id: styleId,
    size: parsed.data.aspectRatio ?? '1:1',
    n: 1,
    response_format: 'b64_json',
    image_format: 'png',
  };
}

export class RecraftProvider {
  constructor(
    private readonly config: RecraftConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async generateImage(request: RecraftImageRequest): Promise<GeneratedRecraftImage> {
    const providerRequest = mapSemanticRequestToProviderRequest(request, this.config.styleId);
    let response: Response;
    try {
      response = await this.fetchImpl(RECRAFT_GENERATION_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(providerRequest),
      });
    } catch {
      throw new RecraftProviderError('Network request could not be completed.', { code: 'NETWORK_ERROR' });
    }

    if (!response.ok) {
      let providerMessage = '';
      try {
        const errorBody: unknown = await response.json();
        if (errorBody && typeof errorBody === 'object') {
          const body = errorBody as { message?: unknown; error?: unknown; detail?: unknown };
          const candidate = [body.message, body.detail, body.error].find((item) => typeof item === 'string');
          if (typeof candidate === 'string') providerMessage = sanitizeProviderMessage(candidate, this.config.apiKey, this.config.styleId);
        }
      } catch {
        // Do not leak raw provider bodies when their shape is not recognized.
      }
      throw new RecraftProviderError('Provider rejected the image request.', {
        code: 'HTTP_ERROR',
        statusCode: response.status,
        ...(providerMessage ? { safeDetail: providerMessage } : {}),
      });
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new RecraftProviderError('Provider returned an unreadable response.', { code: 'INVALID_RESPONSE' });
    }

    const parsed = RecraftApiResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new RecraftProviderError('Provider response did not include a valid image payload.', {
        code: 'INVALID_RESPONSE',
      });
    }

    const encoded = parsed.data.data[0].b64_json;
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
      throw new RecraftProviderError('Provider returned invalid image encoding.', { code: 'INVALID_IMAGE' });
    }

    return {
      bytes: Buffer.from(encoded, 'base64'),
      mimeType: 'image/png',
      prompt: providerRequest.prompt,
      model: providerRequest.model,
    };
  }
}
