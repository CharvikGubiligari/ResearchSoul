# Recommended Tech Stack

Aligned with ResearchSoul.pdf specifications.

## Frontend

| Technology | Purpose |
|------------|---------|
| Next.js (App Router) | Web application |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| TanStack Query | Server state |
| Zustand | Client state |

## Backend

| Technology | Purpose |
|------------|---------|
| NestJS | Modular monolith API |
| Prisma ORM | Database access |
| PostgreSQL | System of record |
| BullMQ | Job orchestration |
| Redis | Cache and queues |

## AI Layer

| Technology | Purpose |
|------------|---------|
| OpenAI API | GPT models |
| Anthropic API | Claude models |
| Google Gemini API | Long context |
| LiteLLM | Unified model gateway |
| LangGraph | Stateful agent workflows |
| MCP | Tool integration (Phase 3) |

## Storage

| Technology | Purpose |
|------------|---------|
| PostgreSQL | Relational data |
| Neo4j | Knowledge graph (Phase 2) |
| pgvector | Embeddings (Phase 2; migrate later) |
| S3-compatible | Documents, exports |
| Redis | Cache, sessions, queues |

## Search & Retrieval

| Technology | Purpose |
|------------|---------|
| Tavily or Exa | Web search |
| Firecrawl | Website extraction |
| Jina AI Reader | Content extraction |
| Unstructured | Document parsing |
| OCR | Scanned PDFs |

## Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Kubernetes | Production orchestration |
| NGINX / Traefik | Reverse proxy |
| GitHub Actions | CI/CD |
| OpenTelemetry | Tracing |
| Prometheus + Grafana | Metrics |
| Loki | Log aggregation |

## Monorepo Structure (Recommended)

```
ResearchSoul/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # NestJS backend
│   └── admin/        # Admin dashboard (Phase 3)
├── packages/
│   ├── shared/       # Types, utils, constants
│   ├── orchestrator/ # Planner, workflow, output
│   ├── agents/       # Agent implementations
│   ├── retrieval/    # Search and extraction
│   ├── evidence/     # Claims, verification, citations
│   ├── knowledge/    # Graph, memory, vector
│   └── llm/          # Router, prompts, cost optimizer
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── monitoring/
└── docs/
```

## Package Manager

Recommend **pnpm workspaces** or **Turborepo** for monorepo management (decision deferred to Phase 0 setup).
