# Module 12 — Claim Extraction Engine

**Phase:** 1

## Pipeline

```
Document → Split (chunks) → Claims → Evidence links → Facts → Entities
```

## Claim Properties

- Atomic factual statement
- Source document reference
- Span/location in document
- Extracted entities (optional, feeds Module 19)

## Implementation

LLM-based extraction with structured output; validated against source text.
