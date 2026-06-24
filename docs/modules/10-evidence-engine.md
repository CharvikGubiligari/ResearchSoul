# Module 10 — Evidence Engine

**Phase:** 1 (MVP) — **Second Moat**

## Core Chain

```
Paragraph → Claims → Evidence → Sources → Confidence
```

## Responsibilities

- Orchestrate claim extraction, linking, deduplication
- Build evidence bundles per research task
- Feed Fact Verification, Contradiction, and Confidence engines

## Example

```
Claim: "Cursor raised $900M"
  → Evidence A (TechCrunch)
  → Evidence B (Crunchbase)
  → Evidence C (Company blog)
  → Confidence: 0.94
```

## Sub-modules

- Claim Extraction (12)
- Citation Engine (11)
- Fact Verification (13)
- Contradiction Engine (14)
- Confidence Engine (15)

## Folder

`packages/evidence/`
