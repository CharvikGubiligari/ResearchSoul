# Phase 0 — Platform Foundation

**Goal:** Runnable platform skeleton with auth, data persistence, background jobs, LLM abstraction, and observability. No research features yet.

## Deliverables

### Authentication & Tenancy
- [x] User signup/login (email + password)
- [x] OAuth (Google — enabled when env vars set)
- [x] Organizations and basic team membership
- [x] Session management (Redis)
- [x] RBAC skeleton (owner, member, viewer)

### Workspace (Basic)
- [x] Organization → Workspace → Project hierarchy in DB
- [x] Project CRUD API
- [x] Basic project list UI

### Storage
- [x] PostgreSQL + Prisma schema (core entities)
- [x] S3-compatible storage setup (local MinIO for dev)
- [x] Redis for cache and queues

### API Gateway
- [x] NestJS monolith scaffold
- [x] Global validation, error handling, CORS
- [x] Health check endpoints
- [x] API versioning prefix (`/api/v1`)

### Background Jobs
- [x] BullMQ + Redis integration
- [x] Sample job processor (proof of queue)
- [x] Job status API

### LLM Abstraction
- [x] OpenAI wrapper via `@researchsoul/llm` (LiteLLM-equivalent for Node)
- [x] Model Router stub (single model initially)
- [x] Prompt template loading from files
- [x] Token/cost logging per call

### Observability
- [x] Structured logging (JSON)
- [x] Request ID middleware
- [x] Docker Compose for local dev (Postgres, Redis, MinIO)

### Billing (Stub)
- [x] Usage event schema
- [x] Credits field on organization (no payment yet)

## Folder Targets

| Area | Path |
|------|------|
| API | `apps/api/` |
| Web | `apps/web/` |
| Shared types | `packages/shared/` |
| LLM | `packages/llm/` |
| Infra | `infrastructure/docker/` |

## Exit Criteria

- User can sign up, create org, create project
- API returns health; jobs process asynchronously
- LLM call works through abstraction with logged cost
- Full stack runs via `docker compose up`

## Does NOT Include

Research planning, agents, retrieval, evidence, or reports.
