# ResearchSoul

**Research Operating System (ROS)** — Autonomous, evidence-backed research platform.

> Status: **Phase 1 implemented** — See [Setup Guide](./docs/phases/SETUP.md) and [Phase 1 PDF Checklist](./docs/phases/phase-1-pdf-checklist.md).

## What It Does

ResearchSoul transforms a research objective (e.g., "Analyze AI coding market") into a **verified, cited report** through:

1. **AI Research Planning** — Objective → execution DAG (questions, agents, sources, dependencies)
2. **Parallel Autonomous Agents** — Domain specialists retrieve and analyze sources
3. **Evidence Pipeline** — Claims linked to evidence linked to sources, with confidence scoring
4. **Report Generation** — Executive summary, deep reports, exports (PDF/Markdown/DOCX)

## Architecture at a Glance

```
User → Next.js → NestJS API → Research Orchestrator → Agents → Retrieval
                                                      ↓
                                              Evidence Engine
                                                      ↓
                                              Reports + Knowledge Graph
```

## Documentation

| Resource | Path |
|----------|------|
| **Docs index** | [docs/README.md](./docs/README.md) |
| Architecture | [docs/architecture/overview.md](./docs/architecture/overview.md) |
| 30 Modules | [docs/modules/README.md](./docs/modules/README.md) |
| Workflows | [docs/workflows/README.md](./docs/workflows/README.md) |
| Phases 0–4 | [docs/phases/README.md](./docs/phases/README.md) |
| Tech stack | [docs/tech-stack.md](./docs/tech-stack.md) |
| Source spec | [ResearchSoul.pdf](./ResearchSoul.pdf) |

## Repository Structure

```
ResearchSoul/
├── apps/                 # Deployable applications (Phase 0+)
│   ├── web/              # Next.js frontend
│   ├── api/              # NestJS API gateway
│   └── admin/            # Admin dashboard (Phase 3)
├── packages/             # Shared libraries (Phase 0–1+)
│   ├── shared/
│   ├── orchestrator/     # Planner, workflow, output
│   ├── agents/
│   ├── retrieval/
│   ├── evidence/
│   ├── knowledge/
│   └── llm/
├── infrastructure/       # Docker, K8s, monitoring
├── docs/                 # Architecture, modules, phases, workflows
└── ResearchSoul.pdf      # Original specification
```

## Development Phases

| Phase | Focus | Timeline |
|-------|-------|----------|
| **0** | Auth, storage, jobs, LLM abstraction, observability | — |
| **1** | MVP: planning, agents, evidence, reports | 8–12 weeks |
| **2** | Workspace, memory, knowledge graph, search | — |
| **3** | API platform, marketplace, enterprise, admin | — |
| **4** | Cross-project intelligence, monitoring, datasets | — |

## Quick Start

See **[Setup Guide](./docs/phases/SETUP.md)** for local development.

```powershell
Copy-Item .env.example .env
npm run docker:up
npm install
npm run db:push
npm run dev:api   # terminal 1
npm run dev:web   # terminal 2
```

## Next Step

Verify Phase 1 locally, then proceed to **[Phase 2 — Research Workspace](./docs/phases/phase-2-workspace.md)**.
