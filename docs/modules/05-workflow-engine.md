# Module 05 — Workflow Engine

**Phase:** 1 (MVP)

## Responsibilities

| Capability | Description |
|------------|-------------|
| Execution Graph | Load and traverse DAG |
| Parallel Execution | Run independent tasks concurrently |
| Dependencies | Wait for upstream task completion |
| Retries | Configurable retry with backoff |
| Scheduling | Queue tasks via BullMQ |
| Timeouts | Kill stuck tasks |
| Checkpointing | Persist state for recovery |
| Resume | Continue from last checkpoint |
| Cancellation | User-initiated abort |
| Progress | Real-time status to frontend |

## State Machine (Execution)

```
PENDING → PLANNING → RUNNING → COMPLETED
                  ↘ FAILED → (retry) → RUNNING
                  ↘ CANCELLED
                  ↘ PAUSED → (resume) → RUNNING
```

## Dependencies

- BullMQ + Redis
- Agent Manager
- PostgreSQL (execution state)
- Observability (traces per task)
