import type {LLMProvider, StructuredGenerationRequest, StructuredGenerationResult} from './provider';

export class MockLLMProvider implements LLMProvider {
  readonly model = 'mock-fixture-v1';
  readonly calls: StructuredGenerationRequest[] = [];

  constructor(private readonly responses: Record<string, string[]>) {}

  async generateStructured(request: StructuredGenerationRequest): Promise<StructuredGenerationResult> {
    this.calls.push(request);
    const queue = this.responses[request.schemaName];
    const text = queue?.shift();
    if (text === undefined) throw new Error(`Mock fixture queue is empty for ${request.schemaName}.`);
    return {text, usage: {inputTokens: 12, outputTokens: 20, totalTokens: 32}};
  }
}
