# ResearchSoul — System Modules

The platform consists of **30 major systems**. Each module is a bounded context with clear inputs, outputs, and dependencies.

## Module Index

| # | Module | Phase | Folder |
|---|--------|-------|--------|
| 1 | [Authentication](./01-authentication.md) | 0 | `apps/api/src/modules/auth` |
| 2 | [Workspace](./02-workspace.md) | 0–2 | `apps/api/src/modules/workspace` |
| 3 | [Research Request](./03-research-request.md) | 1 | `apps/api/src/modules/research` |
| 4 | [Research Planning Engine](./04-research-planning.md) | 1 | `packages/orchestrator/planner` |
| 5 | [Workflow Engine](./05-workflow-engine.md) | 1 | `packages/orchestrator/workflow` |
| 6 | [Agent Manager](./06-agent-manager.md) | 1 | `packages/orchestrator/agent-manager` |
| 7 | [Agent Marketplace](./07-agent-marketplace.md) | 1–3 | `packages/agents` |
| 8 | [Retrieval Layer](./08-retrieval.md) | 1 | `packages/retrieval` |
| 9 | [Source Normalization](./09-source-normalization.md) | 1 | `packages/retrieval/normalization` |
| 10 | [Evidence Engine](./10-evidence-engine.md) | 1 | `packages/evidence` |
| 11 | [Citation Engine](./11-citation-engine.md) | 1 | `packages/evidence/citation` |
| 12 | [Claim Extraction](./12-claim-extraction.md) | 1 | `packages/evidence/claims` |
| 13 | [Fact Verification](./13-fact-verification.md) | 1 | `packages/evidence/verification` |
| 14 | [Contradiction Engine](./14-contradiction-engine.md) | 1 | `packages/evidence/contradiction` |
| 15 | [Confidence Engine](./15-confidence-engine.md) | 1 | `packages/evidence/confidence` |
| 16 | [Knowledge Graph](./16-knowledge-graph.md) | 2 | `packages/knowledge/graph` |
| 17 | [Research Memory](./17-research-memory.md) | 2 | `packages/knowledge/memory` |
| 18 | [Vector Search](./18-vector-search.md) | 2 | `packages/knowledge/vector` |
| 19 | [Entity Resolution](./19-entity-resolution.md) | 2 | `packages/knowledge/entities` |
| 20 | [Report Generator](./20-report-generator.md) | 1 | `packages/orchestrator/output/report` |
| 21 | [Presentation Generator](./21-presentation-generator.md) | 3 | `packages/orchestrator/output/presentation` |
| 22 | [Visualization Engine](./22-visualization-engine.md) | 2–3 | `packages/orchestrator/output/visualization` |
| 23 | [Cost Optimizer](./23-cost-optimizer.md) | 1 | `packages/llm/cost-optimizer` |
| 24 | [Prompt Management](./24-prompt-management.md) | 1 | `packages/llm/prompts` |
| 25 | [Model Router](./25-model-router.md) | 0–1 | `packages/llm/router` |
| 26 | [Evaluation Engine](./26-evaluation-engine.md) | 2–4 | `packages/llm/evaluation` |
| 27 | [Observability](./27-observability.md) | 0 | `infrastructure/monitoring` |
| 28 | [Billing](./28-billing.md) | 0–3 | `apps/api/src/modules/billing` |
| 29 | [API Platform](./29-api-platform.md) | 3 | `apps/api/src/platform` |
| 30 | [Admin Dashboard](./30-admin-dashboard.md) | 3 | `apps/admin` |

## Dependency Layers

```
Phase 0: Auth, Workspace (basic), Storage, API Gateway, Jobs, LLM abstraction, Observability, Billing (basic)
    ↓
Phase 1: Research Request → Planner → Workflow → Agents → Retrieval → Evidence stack → Report Generator
    ↓
Phase 2: Memory, Vector Search, Knowledge Graph, Entity Resolution, Visualizations, Collaboration
    ↓
Phase 3: Agent Marketplace, Presentations, Enterprise RBAC, Public API, MCP, Integrations, Admin
    ↓
Phase 4: Cross-project reasoning, Org-wide KG, Continuous monitoring, Evaluation pipelines, Proprietary datasets
```
