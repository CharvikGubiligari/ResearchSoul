# Research Lifecycle Workflow

## Actors

- **User** — Submits requests, monitors progress, reviews reports
- **Frontend** — Next.js app
- **API** — NestJS gateway
- **Orchestrator** — Planning, workflow, output
- **Agents** — Domain researchers
- **Evidence Stack** — Verification and scoring

## Step-by-Step

### 1. Authentication & Project Setup
```
User logs in → Selects org/workspace → Opens or creates project
```

### 2. Research Request
```
User fills intake form → POST /api/v1/research → Research record created (status: PENDING)
```

### 3. Planning (async job)
```
Planner job queued → LLM generates DAG → Validation → Execution record (status: PLANNED)
→ Optional: user reviews plan → User approves or system auto-proceeds
```

### 4. Execution
```
Workflow Engine loads DAG → For each ready task:
  → Agent Manager dispatches agent
  → Agent retrieves sources
  → Sources normalized to Documents
  → Claims extracted
  → Evidence linked
Frontend receives progress events (task X of Y, agent Z running)
```

### 5. Synthesis & Verification
```
All tasks complete → Evidence aggregated
→ Fact verification across all claims
→ Contradiction pass
→ Confidence scores computed
→ Entities extracted (Phase 2+)
```

### 6. Report Generation
```
Output Generator consumes verified evidence bundle
→ Executive summary + deep report drafted
→ Citations inserted
→ Report stored (S3 + DB metadata)
→ Status: COMPLETED
```

### 7. Delivery
```
User notified → Views report in app → Exports PDF/MD/DOCX
→ Findings stored in Research Memory (Phase 2+)
```

## Failure Paths

| Event | Behavior |
|-------|----------|
| Planning fails | Status FAILED; user can retry with modified objective |
| Agent task fails | Retry N times; if exhausted, mark task failed; workflow may continue partial |
| Budget exceeded | Pause execution; notify user; offer to continue with approval |
| User cancels | Graceful shutdown; partial report optional |
| Timeout | Task killed; checkpoint saved; resume offered |

## Status Transitions (Research)

```
DRAFT → PENDING → PLANNING → RUNNING → SYNTHESIZING → COMPLETED
                              ↘ FAILED
                              ↘ CANCELLED
                              ↘ PAUSED (budget)
```
