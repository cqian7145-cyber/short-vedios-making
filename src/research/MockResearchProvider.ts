import {readFileSync} from 'node:fs';
import path from 'node:path';
import type {ResearchProvider, ResearchSearchOptions, SearchResult} from './provider';

export class MockResearchProvider implements ResearchProvider {
  readonly calls: {query: string; maxResults: number}[] = [];
  private readonly results: SearchResult[];

  constructor(results?: SearchResult[]) {
    this.results = results ?? JSON.parse(readFileSync(path.resolve('tests/fixtures/research/search-results.json'), 'utf8')) as SearchResult[];
  }

  async search(query: string, options: ResearchSearchOptions): Promise<SearchResult[]> {
    this.calls.push({query, maxResults: options.maxResults});
    return this.results.slice(0, options.maxResults).map((result) => ({...result}));
  }
}
