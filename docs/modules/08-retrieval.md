# Module 08 — Retrieval Layer

**Phase:** 1 (MVP)

## Source Types

Web (Google/Bing via Tavily/Exa), News, Arxiv, PubMed, Reddit, GitHub, Crunchbase, SEC, Wikipedia, Blogs, RSS, YouTube, Podcasts, Whitepapers, Books, Internal Docs, PDFs, CSV, Excel.

## Recommended Integrations

| Tool | Use Case |
|------|----------|
| Tavily / Exa | Web search |
| Firecrawl | Website extraction |
| Jina AI Reader | Content extraction |
| Unstructured | Document parsing |
| OCR | Scanned PDFs |

## Interface

```
retrieve(query, sourceTypes[], options) → RawSource[]
```

## Output

Raw sources passed to Source Normalization (Module 09).

## Dependencies

- External API keys (env-configured)
- Rate limiting and cost tracking (Cost Optimizer)
- S3 for cached raw content
