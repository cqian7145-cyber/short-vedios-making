import type {ResearchProvider, ResearchSearchOptions, SearchResult} from './provider';

type TavilyOptions = {fetch?: typeof fetch; baseUrl?: string};

export class TavilyResearchProvider implements ResearchProvider {
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;
  private readonly baseUrl: string;

  constructor(options: TavilyOptions = {}) {
    this.apiKey = process.env.TAVILY_API_KEY ?? '';
    this.fetcher = options.fetch ?? fetch;
    this.baseUrl = options.baseUrl ?? 'https://api.tavily.com/search';
    if (!this.apiKey) throw new Error('TAVILY_API_KEY is missing. Set it in the environment before searching.');
  }

  async search(query: string, options: ResearchSearchOptions): Promise<SearchResult[]> {
    if (!query.trim()) throw new Error('Tavily search query must not be empty.');
    if (!Number.isInteger(options.maxResults) || options.maxResults < 1 || options.maxResults > 5) throw new Error('Tavily maxResults must be an integer from 1 to 5.');
    let response: Response;
    try {
      response = await this.fetcher(this.baseUrl, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({api_key: this.apiKey, query, max_results: options.maxResults, search_depth: 'basic', include_answer: false}),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network request failed';
      throw new Error(`Tavily search failed: ${this.redact(message).slice(0, 400)}`);
    }
    if (!response.ok) {
      const message = await response.text().catch(() => 'request failed');
      throw new Error(`Tavily search failed (HTTP ${response.status}): ${this.redact(message).slice(0, 400)}`);
    }
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object' || !Array.isArray(Reflect.get(payload, 'results'))) {
      throw new Error('Tavily search returned an unexpected response.');
    }
    const results = Reflect.get(payload, 'results') as unknown[];
    return results.slice(0, options.maxResults).flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return [];
      const title = Reflect.get(entry, 'title');
      const url = Reflect.get(entry, 'url');
      const content = Reflect.get(entry, 'content');
      const publishedDate = Reflect.get(entry, 'published_date');
      if (typeof title !== 'string' || typeof url !== 'string' || typeof content !== 'string') return [];
      try { new URL(url); } catch { return []; }
      return [{title: title.slice(0, 500), url, snippet: content.slice(0, 3000), ...(typeof publishedDate === 'string' ? {publishedDate: publishedDate.slice(0, 80)} : {})}];
    });
  }

  private redact(value: string): string {
    return this.apiKey ? value.split(this.apiKey).join('[redacted]').replace(/Bearer\s+\S+/gi, 'Bearer [redacted]') : value;
  }
}
