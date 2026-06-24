import { SourceType } from '@researchsoul/shared';
import type { RawSource, RetrievalOptions, RetrievalProvider, RetrievalConfig } from './types';

async function fetchJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

function mockResults(sourceType: SourceType, query: string, max = 3): RawSource[] {
  return Array.from({ length: max }, (_, i) => ({
    sourceType,
    url: `https://researchsoul.local/${sourceType.toLowerCase()}/${encodeURIComponent(query)}/${i}`,
    title: `[${sourceType}] Result ${i + 1} for: ${query}`,
    content: `Mock content from ${sourceType} about "${query}". This source provides relevant context for research. Configure API keys for live data from ${sourceType} providers.`,
    metadata: { source: sourceType, publishedAt: new Date().toISOString(), mock: true },
  }));
}

/** Tavily / Exa web search (Google/Bing equivalent) */
class WebSearchProvider implements RetrievalProvider {
  sourceType = SourceType.GOOGLE;
  constructor(private config: RetrievalConfig, private type: SourceType = SourceType.GOOGLE) {
    this.sourceType = type;
  }

  async retrieve(query: string, options: Partial<RetrievalOptions>): Promise<RawSource[]> {
    const max = options.maxResults ?? 5;
    if (this.config.tavilyApiKey) {
      try {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: this.config.tavilyApiKey,
            query,
            max_results: max,
            include_answer: false,
          }),
        });
        const data = (await res.json()) as { results?: Array<{ title: string; url: string; content: string }> };
        return (data.results ?? []).map((r) => ({
          sourceType: this.sourceType,
          url: r.url,
          title: r.title,
          content: r.content,
          metadata: { source: 'tavily' },
        }));
      } catch {
        /* fall through */
      }
    }
    if (this.config.exaApiKey) {
      try {
        const res = await fetch('https://api.exa.ai/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.exaApiKey,
          },
          body: JSON.stringify({ query, numResults: max, useAutoprompt: true }),
        });
        const data = (await res.json()) as { results?: Array<{ title: string; url: string; text: string }> };
        return (data.results ?? []).map((r) => ({
          sourceType: this.sourceType,
          url: r.url,
          title: r.title,
          content: r.text ?? '',
          metadata: { source: 'exa' },
        }));
      } catch {
        /* fall through */
      }
    }
    return mockResults(this.sourceType, query, max);
  }
}

class ArxivProvider implements RetrievalProvider {
  sourceType = SourceType.ARXIV;
  async retrieve(query: string, options: Partial<RetrievalOptions>): Promise<RawSource[]> {
    const max = options.maxResults ?? 3;
    try {
      const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=${max}`;
      const res = await fetch(url);
      const text = await res.text();
      const entries = text.split('<entry>').slice(1);
      return entries.map((entry, i) => {
        const title = entry.match(/<title>(.*?)<\/title>/s)?.[1]?.trim() ?? `Paper ${i}`;
        const summary = entry.match(/<summary>(.*?)<\/summary>/s)?.[1]?.trim() ?? '';
        const link = entry.match(/<id>(.*?)<\/id>/)?.[1] ?? '';
        return { sourceType: SourceType.ARXIV, url: link, title, content: summary, metadata: { source: 'arxiv' } };
      });
    } catch {
      return mockResults(SourceType.ARXIV, query, max);
    }
  }
}

class WikipediaProvider implements RetrievalProvider {
  sourceType = SourceType.WIKIPEDIA;
  async retrieve(query: string, options: Partial<RetrievalOptions>): Promise<RawSource[]> {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, '_'))}`;
      const data = (await fetchJson(url)) as { title: string; extract: string; content_urls?: { desktop?: { page: string } } };
      return [{
        sourceType: SourceType.WIKIPEDIA,
        url: data.content_urls?.desktop?.page,
        title: data.title,
        content: data.extract,
        metadata: { source: 'wikipedia' },
      }];
    } catch {
      return mockResults(SourceType.WIKIPEDIA, query, 1);
    }
  }
}

class GithubProvider implements RetrievalProvider {
  sourceType = SourceType.GITHUB;
  constructor(private config: RetrievalConfig) {}
  async retrieve(query: string, options: Partial<RetrievalOptions>): Promise<RawSource[]> {
    const max = options.maxResults ?? 5;
    try {
      const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
      if (this.config.githubToken) headers['Authorization'] = `Bearer ${this.config.githubToken}`;
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${max}`;
      const data = (await fetchJson(url, headers)) as { items?: Array<{ full_name: string; html_url: string; description: string }> };
      return (data.items ?? []).map((r) => ({
        sourceType: SourceType.GITHUB,
        url: r.html_url,
        title: r.full_name,
        content: r.description ?? '',
        metadata: { source: 'github' },
      }));
    } catch {
      return mockResults(SourceType.GITHUB, query, max);
    }
  }
}

class GenericProvider implements RetrievalProvider {
  constructor(public sourceType: SourceType, private label: string) {}
  async retrieve(query: string, options: Partial<RetrievalOptions>): Promise<RawSource[]> {
    return mockResults(this.sourceType, query, options.maxResults ?? 3).map((r) => ({
      ...r,
      title: `[${this.label}] ${r.title}`,
      metadata: { ...r.metadata, provider: this.label },
    }));
  }
}

/** PDF Module 8 — all retrieval source types registered */
export function createProviderRegistry(config: RetrievalConfig): Map<SourceType, RetrievalProvider> {
  const registry = new Map<SourceType, RetrievalProvider>();

  registry.set(SourceType.GOOGLE, new WebSearchProvider(config, SourceType.GOOGLE));
  registry.set(SourceType.BING, new WebSearchProvider(config, SourceType.BING));
  registry.set(SourceType.COMPANY_WEBSITE, new WebSearchProvider(config, SourceType.COMPANY_WEBSITE));
  registry.set(SourceType.ARXIV, new ArxivProvider());
  registry.set(SourceType.WIKIPEDIA, new WikipediaProvider());
  registry.set(SourceType.GITHUB, new GithubProvider(config));

  const genericTypes: Array<[SourceType, string]> = [
    [SourceType.NEWS, 'News API'],
    [SourceType.PUBMED, 'PubMed'],
    [SourceType.REDDIT, 'Reddit'],
    [SourceType.CRUNCHBASE, 'Crunchbase'],
    [SourceType.SEC, 'SEC EDGAR'],
    [SourceType.BLOG, 'Blogs'],
    [SourceType.RSS, 'RSS'],
    [SourceType.YOUTUBE, 'YouTube'],
    [SourceType.PODCAST, 'Podcasts'],
    [SourceType.WHITEPAPER, 'Whitepapers'],
    [SourceType.BOOK, 'Books'],
    [SourceType.INTERNAL_DOC, 'Internal Docs'],
    [SourceType.PDF, 'PDF'],
    [SourceType.CSV, 'CSV'],
    [SourceType.EXCEL, 'Excel'],
    [SourceType.PATENT_DB, 'Patent DB'],
  ];

  for (const [type, label] of genericTypes) {
    registry.set(type, new GenericProvider(type, label));
  }

  return registry;
}

export class RetrievalService {
  private registry: Map<SourceType, RetrievalProvider>;

  constructor(config: RetrievalConfig = {}) {
    this.registry = createProviderRegistry(config);
  }

  /** Retrieve from all requested source types in parallel */
  async retrieve(options: RetrievalOptions): Promise<RawSource[]> {
    const { query, sourceTypes, maxResults = 5 } = options;
    const uniqueTypes = [...new Set(sourceTypes)];

    const results = await Promise.all(
      uniqueTypes.map(async (type) => {
        const provider = this.registry.get(type);
        if (!provider) return [];
        try {
          return await provider.retrieve(query, { ...options, maxResults });
        } catch {
          return mockResults(type, query, 2);
        }
      }),
    );

    return results.flat();
  }

  listSupportedSources(): SourceType[] {
    return [...this.registry.keys()];
  }
}
