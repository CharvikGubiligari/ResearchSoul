# Module 04 — Research Planning Engine

**Phase:** 1 (MVP) — **First Moat**

## Purpose

Transform a research objective into an **Execution DAG** (Directed Acyclic Graph).

## Input

```
"Analyze AI coding market"
```

## Output

- Top-level questions
- Sub-questions per question
- Required sources per sub-question
- Required agents per sub-question
- Expected outputs per task
- Task dependencies
- Execution graph (DAG JSON)

## Example DAG Structure

```
Q1: Market size and growth
  ├── Q1.1: TAM/SAM/SOM estimates → Market Agent → [web, reports]
  ├── Q1.2: Growth drivers → Trend Agent → [news, academic]
  └── Q1.2 depends on Q1.1

Q2: Competitive landscape (parallel with Q1)
  ├── Q2.1: Key players → Competitor Agent → [Crunchbase, web]
  └── Q2.2: Feature comparison → Product Agent → [websites, GitHub]
```

## Implementation Notes

- Use LLM (via Model Router) for initial plan generation
- Validate DAG acyclicity before persistence
- Store plan snapshot on `Execution` entity
- Allow human review/edit before execution (optional Phase 1 stretch)

## Dependencies

- Model Router / LLM Layer
- Research Request module
- Workflow Engine (consumer)
