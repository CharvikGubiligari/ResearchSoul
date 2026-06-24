# Module 09 — Source Normalization

**Phase:** 1 (MVP)

## Purpose

Every raw source becomes a standard **Document** with consistent metadata.

## Document Schema

| Field | Description |
|-------|-------------|
| id | Unique identifier |
| metadata.author | Author or organization |
| metadata.publisher | Publishing entity |
| metadata.timestamp | Publication date |
| metadata.type | web, paper, filing, social, etc. |
| metadata.language | ISO language code |
| metadata.url | Source URL |
| content | Extracted text |
| metadata.license | Usage rights |
| metadata.reliability | Heuristic score (0–1) |

## Pipeline

```
RawSource → Parse → Extract metadata → Score reliability → Document
```

## Dependencies

- Retrieval Layer
- PostgreSQL + S3 (content storage)
