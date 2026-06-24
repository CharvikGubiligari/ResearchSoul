# Phase 1 — MVP (8–12 weeks)

**Goal:** End-to-end autonomous research: objective in → verified, cited report out.

## Core User Journey

1. User creates project and submits research objective
2. System generates execution DAG (Research Planning Engine)
3. Workflow Engine runs agents in parallel where possible
4. Agents retrieve and normalize sources
5. Evidence pipeline extracts claims, verifies, scores confidence
6. Report Generator produces executive summary + deep report
7. User exports PDF / Markdown / DOCX

## Deliverables

### Research Intake
- [ ] Research request form (all intake fields)
- [ ] Research entity persistence
- [ ] Trigger planning job on submit

### Research Planning Engine (Moat #1)
- [ ] LLM-based objective → DAG generation
- [ ] DAG validation (acyclicity, agent/source mapping)
- [ ] Plan preview UI (optional stretch)
- [ ] Execution entity with DAG snapshot

### Workflow Engine
- [ ] DAG topological execution
- [ ] Parallel task scheduling (BullMQ)
- [ ] Retries, timeouts, checkpointing
- [ ] Progress SSE/WebSocket to frontend
- [ ] Cancel research run

### Agent Manager + Core Agents
- [ ] Agent registry and dispatch
- [ ] Minimum viable agents: Market, Competitor, News, Web (generic)
- [ ] LangGraph agent workflows
- [ ] Agent health and failure handling

### Retrieval Layer
- [ ] Web search (Tavily or Exa)
- [ ] Website extraction (Firecrawl or Jina)
- [ ] PDF/document upload parsing (Unstructured)
- [ ] Source caching in S3

### Source Normalization
- [ ] Document schema and persistence
- [ ] Metadata extraction
- [ ] Reliability heuristics

### Evidence Stack (Moat #2)
- [ ] Claim extraction from documents
- [ ] Evidence linking (claim ↔ sources)
- [ ] Fact verification (multi-source)
- [ ] Contradiction detection (basic)
- [ ] Confidence scoring
- [ ] Citation formatting (APA + inline minimum)

### Output
- [ ] Executive summary generation
- [ ] Deep report generation
- [ ] Export: PDF, Markdown, DOCX
- [ ] Report viewer in frontend with citations

### Supporting
- [ ] Model Router (task-based routing)
- [ ] Cost Optimizer (budget enforcement)
- [ ] Prompt library for planner, agents, report writer

## Exit Criteria

- Demo: "Analyze AI coding market" → cited report in <30 min (target)
- Every major claim in report links to evidence and sources
- Contradictions flagged where sources disagree
- Research run fully traced in logs

## Dependencies

Phase 0 complete.

## Folder Targets

| Area | Path |
|------|------|
| Orchestrator | `packages/orchestrator/` |
| Agents | `packages/agents/core/` |
| Retrieval | `packages/retrieval/` |
| Evidence | `packages/evidence/` |
