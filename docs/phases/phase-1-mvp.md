# Phase 1 — MVP (8–12 weeks)

**Goal:** End-to-end autonomous research: objective in → verified, cited report out.

> **PDF coverage:** See [phase-1-pdf-checklist.md](./phase-1-pdf-checklist.md) for complete feature mapping.

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
- [x] Research request form (all intake fields)
- [x] Research entity persistence
- [x] Trigger planning job on submit

### Research Planning Engine (Moat #1)
- [x] LLM-based objective → DAG generation
- [x] DAG validation (acyclicity, agent/source mapping)
- [x] Execution entity with DAG snapshot

### Workflow Engine
- [x] DAG topological execution
- [x] Parallel task scheduling (BullMQ)
- [x] Retries, timeouts, checkpointing
- [x] Progress SSE/polling to frontend
- [x] Cancel research run

### Agent Manager + Core Agents
- [x] Agent registry and dispatch
- [x] All 12 PDF agents (Market through Trend)
- [x] Agent health and failure handling

### Retrieval Layer
- [x] Web search (Tavily/Exa)
- [x] All PDF source types registered
- [x] Arxiv, Wikipedia, GitHub live; others mock without API keys
- [x] Source caching via S3

### Source Normalization
- [x] Document schema and persistence
- [x] Metadata extraction
- [x] Reliability heuristics

### Evidence Stack (Moat #2)
- [x] Claim extraction from documents
- [x] Evidence linking (claim ↔ sources)
- [x] Fact verification (multi-source)
- [x] Contradiction detection
- [x] Confidence scoring
- [x] Citation formatting (APA, MLA, Chicago, IEEE, Bluebook)

### Output
- [x] Executive summary generation
- [x] Deep report generation (all 10 output types)
- [x] Export: PDF, Markdown, DOCX
- [x] Report viewer in frontend with citations

### Supporting
- [x] Model Router (task-based routing, all model families)
- [x] Cost Optimizer (budget enforcement)
- [x] Prompt library for planner, agents, report writer

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
