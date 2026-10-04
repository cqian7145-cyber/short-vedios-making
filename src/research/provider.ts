export type ResearchSearchOptions = {maxResults: number};
export type SearchResult = {title: string; url: string; snippet: string; publishedDate?: string};

export interface ResearchProvider {
  search(query: string, options: ResearchSearchOptions): Promise<SearchResult[]>;
}
