# Phase 1 — PDF Feature Coverage Checklist

Every feature from ResearchSoul.pdf included in Phase 1 MVP scope.

## Research Orchestrator (Brain)

| Component | Status | Package/Path |
|-----------|--------|--------------|
| Task Planner | ✅ | `packages/orchestrator/planner` |
| Workflow Engine | ✅ | `packages/orchestrator` (DAG batches, BullMQ) |
| Agent Manager | ✅ | `packages/orchestrator/agent-manager` |
| Citation Engine | ✅ | `packages/evidence/citation` |
| Fact Checker | ✅ | `packages/evidence/verification` |
| Contradiction Engine | ✅ | `packages/evidence/contradiction` |
| Confidence Engine | ✅ | `packages/evidence/confidence` |
| Output Generator | ✅ | `packages/orchestrator/report-generator` |

## 12 Autonomous Agents (each owns Tools, Prompt, Memory, Planner, Validator)

| Agent | Status |
|-------|--------|
| Market | ✅ |
| Competitor | ✅ |
| Funding | ✅ |
| Customer | ✅ |
| Technology | ✅ |
| Patent | ✅ |
| Academic | ✅ |
| News | ✅ |
| Financial | ✅ |
| Product | ✅ |
| Legal | ✅ |
| Trend | ✅ |

## Retrieval Layer (all source types)

Google, Bing, News, Arxiv, PubMed, Reddit, GitHub, Crunchbase, SEC, Wikipedia, Blogs, RSS, YouTube, Podcasts, Whitepapers, Books, Internal Docs, PDFs, CSV, Excel, Company Websites, Patent DB — **all registered** in `packages/retrieval`

## Evidence Layer

| Feature | Status |
|---------|--------|
| Source Extraction | ✅ |
| Source Normalization (full metadata) | ✅ |
| Claim Extraction | ✅ |
| Citation Verification | ✅ |
| Deduplication | ✅ |
| Evidence Linking | ✅ |

## Citation Engine

APA, MLA, Chicago, IEEE, Bluebook · Inline, Footnotes, Endnotes — **all supported**

## Report Generator (all output types)

Executive Summary, Deep Report, Investment Memo, Market Report, Technical Review, SWOT, PESTLE, Porter's Five Forces, Competitive Matrix, Landscape Analysis — **all supported**

## Export

PDF (HTML), Markdown, DOCX — **all supported**

## Research Request (all intake fields)

Objective, Type, Depth, Budget, Deadline, Language, Country, Audience, Output Type, Custom Instructions, Priority, Citation Style/Mode — **all in form + API**

## Supporting Systems

| Module | Status |
|--------|--------|
| Model Router (GPT, Claude, Gemini, Llama, Qwen, Mixtral) | ✅ |
| Cost Optimizer | ✅ |
| Prompt Management | ✅ |
| Workflow: Retries, Parallel, Dependencies, Timeouts, Checkpointing, Resume, Cancel, Progress | ✅ |

## Deferred to Phase 2+ (per PDF phasing)

Knowledge Graph (Neo4j), Vector Search, Research Memory, Entity Resolution, Visualization, Presentation Generator, Evaluation Engine, API Platform, Admin Dashboard, Neo4j storage

## Phase 1 Exit Criteria

- [ ] "Analyze AI coding market" → cited report
- [ ] Every major claim links to evidence and sources
- [ ] Contradictions flagged
- [ ] Export PDF/MD/DOCX
- [ ] Full run traced in logs
