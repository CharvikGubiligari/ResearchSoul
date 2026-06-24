# ResearchSoul — Architecture Overview

ResearchSoul is a **Research Operating System (ROS)**: an autonomous, evidence-backed research platform that plans, executes, verifies, and delivers structured research outputs.

## Design Philosophy

- **Not a chatbot** — A full research pipeline with planning, agents, evidence, and verified outputs.
- **Evidence-first** — Every claim links to evidence; every evidence links to sources.
- **DAG-driven execution** — Research plans are directed acyclic graphs, not flat task lists.
- **Modular monolith initially** — NestJS backend with clear module boundaries; split services later if needed.

## High-Level Stack

```
USER
  │
  ▼
Next.js Frontend (App Router, TypeScript, shadcn/ui)
  │
  ▼
API Gateway (NestJS)
  │
  ├── Authentication / Billing
  │
  ▼
Research Orchestrator (Brain of the Platform)
  │
  ├── Task Planner
  ├── Workflow Engine
  ├── Agent Manager
  ├── Memory Manager
  ├── Knowledge Graph
  ├── Citation Engine
  ├── Fact Checker
  ├── Contradiction Engine
  ├── Confidence Engine
  └── Output Generator
  │
  ▼
Autonomous Agent Layer (Market, Competitor, Funding, Customer, Technology,
                        Patent, Academic, News, Financial, Product, Legal, Trend)
  │
  ▼
Retrieval Layer → Evidence Layer → Knowledge Layer → LLM Layer → Storage Layer
```

## Core Moats

| Moat | Description |
|------|-------------|
| **Research Planning Engine** | Transforms objectives into a DAG of questions, agents, sources, and dependencies |
| **Evidence Engine** | Claim → Evidence → Source chain with confidence scoring |
| **Agent Marketplace** | Independent, composable agents with own tools, prompts, memory, and validators |

## Related Documents

- [System Layers](./system-layers.md)
- [Data Flow](./data-flow.md)
- [Data Model](./data-model.md)
- [Tech Stack](../tech-stack.md)
- [Development Phases](../phases/README.md)
