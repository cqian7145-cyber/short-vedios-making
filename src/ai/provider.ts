export type StructuredGenerationRequest = {
  schemaName: string;
  schema: Record<string, unknown>;
  instructions: string;
  input: string;
  maxOutputTokens: number;
};

export type StructuredGenerationResult = {
  text: string;
  usage?: {inputTokens?: number; outputTokens?: number; totalTokens?: number};
};

export interface LLMProvider {
  readonly model: string;
  generateStructured(request: StructuredGenerationRequest): Promise<StructuredGenerationResult>;
}
