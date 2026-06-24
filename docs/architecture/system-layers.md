# System Layers

ResearchSoul is organized into eight logical layers. Each layer has a single responsibility and well-defined interfaces to adjacent layers.

## Layer 1 — Presentation

| Component | Role |
|-----------|------|
| Next.js Frontend | Research intake, project workspace, report viewing, dashboards |
| Admin Dashboard | Users, costs, failures, models, analytics, feature flags |

## Layer 2 — API & Gateway

| Component | Role |
|-----------|------|
| NestJS API Gateway | REST/GraphQL entry point, rate limiting, request routing |
| Authentication / Billing | Login, OAuth, RBAC, subscriptions, credits, API keys |
| Public API / Webhooks / SDK / MCP / CLI | External integrations (Phase 3+) |

## Layer 3 — Research Orchestrator (Brain)

The orchestrator coordinates the entire research lifecycle. It does **not** perform retrieval or LLM calls directly — it delegates to specialized engines.

| Engine | Responsibility |
|--------|----------------|
| **Task Planner** | Objective → questions, sub-questions, required sources/agents, execution DAG |
| **Workflow Engine** | DAG execution: parallel runs, retries, timeouts, checkpointing, resume/cancel |
| **Agent Manager** | Start/stop agents, health, resource allocation, state sync, agent registry |
| **Memory Manager** | Past projects, findings, summaries, user preferences, versions |
| **Knowledge Graph** | Entity/relationship storage and queries |
| **Citation Engine** | APA, MLA, Chicago, IEEE, Bluebook; inline/footnotes/endnotes |
| **Fact Checker** | Cross-source verification: consistency, freshness, authority |
| **Contradiction Engine** | Conflict detection, alternative viewpoints, confidence adjustment |
| **Confidence Engine** | Scores from authority, agreement, recency, evidence count, citation quality |
| **Output Generator** | Executive summary, deep reports, memos, exports (PDF/MD/DOCX/PPT) |

## Layer 4 — Autonomous Agent Layer

Each agent is **independent** and owns: Tools, Prompt, Memory, Planner, Validator.

| Agent | Domain |
|-------|--------|
| Market Agent | Market sizing, segments, trends |
| Competitor Agent | Competitive landscape, positioning |
| Funding Agent | VC rounds, investors, valuations |
| Customer Agent | Reviews, sentiment, personas |
| Technology Agent | Stack, architecture, technical depth |
| Patent Agent | IP landscape, filings |
| Academic Agent | Papers, citations, research trends |
| News Agent | Recent events, press coverage |
| Financial Agent | SEC filings, financials, metrics |
| Product Agent | Features, pricing, product strategy |
| Legal Agent | Regulations, compliance, litigation |
| Trend Agent | Emerging trends, forecasts |

Additional agents (Phase 3+): GitHub, Hiring, Pricing, Security, Compliance, Customer Review.

## Layer 5 — Retrieval Layer

Unified access to external and internal data:

Google/Bing, News APIs, Arxiv, PubMed, Reddit, GitHub, Crunchbase, SEC, Wikipedia, Blogs, RSS, YouTube, Podcasts, Whitepapers, Books, Internal Docs, PDFs, CSV, Excel.

**Integrations (recommended):** Tavily/Exa (search), Firecrawl (extraction), Jina Reader, Unstructured (parsing), OCR.

## Layer 6 — Evidence Layer

| Step | Output |
|------|--------|
| Source Extraction | Raw content from retrieval |
| Source Normalization | Standard `Document` with metadata (author, publisher, timestamp, type, URL, license, reliability) |
| Claim Extraction | Atomic claims from documents |
| Citation Verification | Claim ↔ source linkage |
| Deduplication | Remove redundant evidence |
| Evidence Linking | Claim → Evidence A/B/C → Confidence |

## Layer 7 — Knowledge Layer

| Store | Purpose |
|-------|---------|
| Knowledge Graph (Neo4j) | Entities and relationships |
| Vector Database (pgvector → dedicated) | Semantic/hybrid search, RAG, embeddings |
| Research Memory | Project history, findings, user decisions |
| Entity Database | Resolved entities (OpenAI = Open AI = OpenAI Inc.) |
| Relationship Graph | Cross-entity connections |

## Layer 8 — Infrastructure

Docker, Kubernetes, NGINX/Traefik, GitHub Actions, OpenTelemetry, Prometheus, Grafana, Loki, Redis (cache + queues via BullMQ), PostgreSQL, S3, Neo4j.
