# Module 03 — Research Request

**Phase:** 1 (MVP)

## Intake Fields

| Field | Description |
|-------|-------------|
| Research Objective | Primary question or goal |
| Research Type | Market, competitive, technical, investment, etc. |
| Depth | Shallow / standard / deep |
| Budget | Max spend for LLM + retrieval |
| Deadline | Target completion time |
| Language | Output language |
| Country | Geographic focus |
| Audience | Executive, technical, investor, etc. |
| Output Type | Summary, deep report, memo, SWOT, etc. |
| Custom Instructions | Free-form constraints |
| Priority | Queue priority |

## Flow

1. User submits request via frontend
2. API validates and persists `Research` entity
3. Triggers Planning Engine asynchronously
4. Returns research ID + execution tracking URL

## Dependencies

- Workspace / Project
- Workflow Engine (trigger)
- BullMQ job queue
