import { SourceType, DocumentType, type NormalizedDocument } from '@researchsoul/shared';
import type { RawSource } from './types';

const SOURCE_TO_DOC_TYPE: Partial<Record<SourceType, DocumentType>> = {
  [SourceType.GOOGLE]: DocumentType.WEB,
  [SourceType.BING]: DocumentType.WEB,
  [SourceType.NEWS]: DocumentType.NEWS,
  [SourceType.ARXIV]: DocumentType.PAPER,
  [SourceType.PUBMED]: DocumentType.PAPER,
  [SourceType.REDDIT]: DocumentType.SOCIAL,
  [SourceType.GITHUB]: DocumentType.CODE,
  [SourceType.SEC]: DocumentType.FILING,
  [SourceType.WIKIPEDIA]: DocumentType.WEB,
  [SourceType.YOUTUBE]: DocumentType.VIDEO,
  [SourceType.PODCAST]: DocumentType.PODCAST,
  [SourceType.PATENT_DB]: DocumentType.PATENT,
  [SourceType.PDF]: DocumentType.PDF,
  [SourceType.CSV]: DocumentType.SPREADSHEET,
  [SourceType.EXCEL]: DocumentType.SPREADSHEET,
  [SourceType.BOOK]: DocumentType.BOOK,
  [SourceType.INTERNAL_DOC]: DocumentType.INTERNAL,
  [SourceType.COMPANY_WEBSITE]: DocumentType.WEB,
};

const AUTHORITY_SCORES: Partial<Record<SourceType, number>> = {
  [SourceType.SEC]: 0.95,
  [SourceType.ARXIV]: 0.9,
  [SourceType.PUBMED]: 0.9,
  [SourceType.PATENT_DB]: 0.9,
  [SourceType.CRUNCHBASE]: 0.85,
  [SourceType.GITHUB]: 0.8,
  [SourceType.WIKIPEDIA]: 0.75,
  [SourceType.NEWS]: 0.7,
  [SourceType.GOOGLE]: 0.65,
  [SourceType.REDDIT]: 0.5,
  [SourceType.BLOG]: 0.55,
};

/** PDF Module 9 — Source Normalization */
export function normalizeSource(raw: RawSource, language = 'en'): NormalizedDocument {
  const meta = raw.metadata ?? {};
  const docType = SOURCE_TO_DOC_TYPE[raw.sourceType] ?? DocumentType.OTHER;
  let reliability = AUTHORITY_SCORES[raw.sourceType] ?? 0.6;

  if (raw.url?.includes('.gov')) reliability = Math.min(1, reliability + 0.1);
  if (raw.url?.includes('.edu')) reliability = Math.min(1, reliability + 0.08);
  if ((meta['publishedAt'] as string)?.length) {
    const age = Date.now() - new Date(meta['publishedAt'] as string).getTime();
    if (age < 365 * 24 * 60 * 60 * 1000) reliability = Math.min(1, reliability + 0.05);
  }

  return {
    metadata: {
      author: (meta['author'] as string) ?? undefined,
      publisher: (meta['publisher'] as string) ?? (meta['source'] as string) ?? undefined,
      timestamp: (meta['publishedAt'] as string) ?? new Date().toISOString(),
      type: docType,
      language,
      url: raw.url,
      license: (meta['license'] as string) ?? undefined,
      reliability,
    },
    content: raw.content,
    title: raw.title,
  };
}

export function normalizeSources(sources: RawSource[], language = 'en'): NormalizedDocument[] {
  return sources.map((s) => normalizeSource(s, language));
}
