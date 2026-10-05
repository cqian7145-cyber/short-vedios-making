export class RecraftProviderError extends Error {
  readonly statusCode?: number;
  readonly code: string;
  readonly safeDetail?: string;

  constructor(message: string, options: { statusCode?: number; code: string; safeDetail?: string }) {
    super(message);
    this.name = 'RecraftProviderError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.safeDetail = options.safeDetail;
  }
}

export function safeRecraftError(error: unknown): string {
  if (error instanceof RecraftProviderError) {
    const prefix = error.statusCode
      ? `Recraft request failed (${error.statusCode}): ${error.message}`
      : `Recraft request failed: ${error.message}`;
    return error.safeDetail ? `${prefix} ${error.safeDetail}` : prefix;
  }
  return 'Recraft request failed due to a network or unexpected provider error.';
}
