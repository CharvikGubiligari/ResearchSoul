# Phase 0 Setup Guide

## Prerequisites

- Node.js 18+
- Docker Desktop (for Postgres, Redis, MinIO)
- npm 9+ (pnpm optional)

## 1. Environment

```powershell
Copy-Item .env.example .env
# Edit .env if needed (JWT_SECRET, OPENAI_API_KEY optional)
```

## 2. Start infrastructure

```powershell
npm run docker:up
```

Services:
| Service  | URL |
|----------|-----|
| Postgres | localhost:5432 |
| Redis    | localhost:6379 |
| MinIO    | localhost:9000 (console :9001) |

## 3. Install dependencies

```powershell
npm install
```

First install may take several minutes on slow networks.

## 4. Database

```powershell
npm run db:push
```

## 5. Run development servers

Terminal 1 — API:
```powershell
npm run dev:api
```

Terminal 2 — Web:
```powershell
npm run dev:web
```

## 6. Verify Phase 1

| Check | How |
|-------|-----|
| Sign up / create project | http://localhost:3000/signup |
| Start research | Dashboard → project → **+ Start research** |
| Full intake form | All PDF fields: objective, type, depth, budget, deadline, language, country, audience, output type, priority, citations |
| Monitor progress | Research detail page shows progress bar + agent events |
| View report | Executive summary + deep report with citations |
| Export | Markdown, DOCX, PDF buttons on report |
| Agents API | GET /api/v1/agents (12 agents) |
| Sources API | GET /api/v1/retrieval/sources (all PDF source types) |

## Google OAuth (optional)

Set in `.env`:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Restart API. "Continue with Google" appears on login.

## API routes (Phase 0)

| Method | Path | Auth |
|--------|------|------|
| POST | /api/v1/auth/signup | No |
| POST | /api/v1/auth/login | No |
| POST | /api/v1/auth/logout | Yes |
| GET | /api/v1/auth/me | Yes |
| GET | /api/v1/auth/google | No |
| GET | /api/v1/health | No |
| GET | /api/v1/organizations/:orgId/workspaces | Yes |
| POST | /api/v1/workspaces/:id/projects | Yes |
| POST | /api/v1/jobs/sample | Yes |
| GET | /api/v1/jobs/:id | Yes |
| POST | /api/v1/llm/chat | Yes |
