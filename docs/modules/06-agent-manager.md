# Module 06 — Agent Manager

**Phase:** 1 (MVP)

## Responsibilities

- Start / stop agent instances
- Retry failed agents
- Health monitoring
- Resource allocation (concurrency limits)
- Agent-to-orchestrator communication
- State synchronization
- Agent registry (available agent types + capabilities)

## Agent Lifecycle

```
REGISTERED → IDLE → RUNNING → COMPLETED | FAILED
```

## Interface

Agent Manager exposes:

- `dispatch(task, agentType, context)` → agent run ID
- `getStatus(runId)` → progress, partial results
- `cancel(runId)`
- `listAgents()` → registry with capabilities

## Dependencies

- Workflow Engine
- Agent Marketplace (`packages/agents`)
- LangGraph (stateful agent workflows)
