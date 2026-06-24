import { SourceType, DocumentType, type NormalizedDocument } from '@researchsoul/shared';

export interface RawSource {
  sourceType: SourceType;
  url?: string;
  title?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface RetrievalOptions {
  query: string;
  sourceTypes: SourceType[];
  maxResults?: number;
  language?: string;
  country?: string;
}

export interface RetrievalProvider {
  sourceType: SourceType;
  retrieve(query: string, options: Partial<RetrievalOptions>): Promise<RawSource[]>;
}

export interface RetrievalConfig {
  tavilyApiKey?: string;
  exaApiKey?: string;
  firecrawlApiKey?: string;
  jinaApiKey?: string;
  githubToken?: string;
  newsApiKey?: string;
}
