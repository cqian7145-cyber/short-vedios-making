import OpenAI from 'openai';
import type {LLMProvider, StructuredGenerationRequest, StructuredGenerationResult} from '../provider';
import {MAX_NETWORK_RETRIES, DEEPSEEK_BASE_URL, type DeepSeekConfig} from './config';
import {MAX_OUTPUT_TOKEN_RETRIES, MAX_STRUCTURED_OUTPUT_TOKENS} from '../generationConfig';

const RETRY_DELAY_MS = 700;

const isTransient = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const status = 'status' in error && typeof error.status === 'number' ? error.status : undefined;
  if (status !== undefined) return status === 408 || status === 429 || status >= 500;
  const cause = 'cause' in error && error.cause && typeof error.cause === 'object' ? error.cause : undefined;
  const code = ('code' in error ? String(error.code) : '') || (cause && 'code' in cause ? String(cause.code) : '');
  const name = cause && 'name' in cause ? String(cause.name) : '';
  return ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_SOCKET'].includes(code)
    || name === 'AbortError' || name === 'TimeoutError';
};

const safeMessage = (error: unknown, apiKey: string): string => {
  const message = error instanceof Error ? error.message : 'Unknown network error';
  const redacted = apiKey ? message.split(apiKey).join('[redacted]') : message;
  return redacted.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').slice(0, 500);
};

export class DeepSeekProvider implements LLMProvider {
  readonly model: DeepSeekConfig['model'];
  private readonly client: OpenAI;

  constructor(config: DeepSeekConfig, options: {timeoutMs?: number; sleep?: (ms: number) => Promise<void>; baseURL?: string; fetch?: typeof fetch} = {}) {
    this.model = config.model;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: options.baseURL ?? DEEPSEEK_BASE_URL,
      timeout: options.timeoutMs ?? 60_000,
      maxRetries: 0,
      fetch: options.fetch,
    });
  }

  private readonly sleep: (ms: number) => Promise<void>;

  async generateStructured(request: StructuredGenerationRequest): Promise<StructuredGenerationResult> {
    const initialBudget = Math.min(request.maxOutputTokens, MAX_STRUCTURED_OUTPUT_TOKENS);
    let currentBudget = initialBudget;
    let networkRetryCount = 0;
    let outputTokenRetryCount = 0;

    while (true) {
      let response;
      try {
        response = await this.client.responses.create({
          model: this.model,
          instructions: request.instructions,
          input: request.input,
          max_output_tokens: currentBudget,
          reasoning: {effort: 'low'},
          text: {
            format: {
              type: 'json_schema',
              name: request.schemaName,
              schema: request.schema,
            },
          },
        });
      } catch (error) {
        if (networkRetryCount < MAX_NETWORK_RETRIES && isTransient(error)) {
          networkRetryCount += 1;
          await this.sleep(RETRY_DELAY_MS * networkRetryCount);
          continue;
        }
        const status = error && typeof error === 'object' && 'status' in error ? ` (HTTP ${String(error.status)})` : '';
        throw new Error(`DeepSeek request failed${status}: ${safeMessage(error, this.client.apiKey ?? '')}`);
      }

      if (response.status === 'incomplete' && response.incomplete_details?.reason === 'max_output_tokens') {
        const nextBudget = Math.min(request.maxOutputTokens * 2, MAX_STRUCTURED_OUTPUT_TOKENS);
        if (outputTokenRetryCount < MAX_OUTPUT_TOKEN_RETRIES && nextBudget > currentBudget) {
          outputTokenRetryCount += 1;
          currentBudget = nextBudget;
          continue;
        }
        throw new Error([
          `DeepSeek structured output exceeded token budget after ${outputTokenRetryCount + 1} attempts.`,
          `Initial budget: ${initialBudget}`,
          `Final budget: ${currentBudget}`,
        ].join('\n'));
      }

      if (response.status !== 'completed') {
        throw new Error(`DeepSeek response ended with status "${response.status}"${response.incomplete_details?.reason ? ` (${response.incomplete_details.reason})` : ''}.`);
      }
      const text = response.output_text;
      if (!text.trim()) throw new Error('DeepSeek returned empty structured output.');
      return {
        text,
        usage: response.usage ? {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    }
  }
}
