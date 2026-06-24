# Phase 2 — Research Workspace

**Goal:** Persistent, searchable research environment with knowledge graph and collaboration.

## Deliverables

### Persistent Projects
- [ ] Multi-run research per project
- [ ] Project folders, tags, archives
- [ ] Templates for common research types
- [ ] Version history for reports

### Research Memory
- [ ] Store past findings per project/workspace
- [ ] Recall prior evidence in new research runs
- [ ] User decision logging ("accepted/rejected finding")

### Semantic Search
- [ ] Embedding pipeline (chunk → embed → store)
- [ ] pgvector hybrid search
- [ ] Search UI across project documents and claims

### Entity Extraction & Resolution
- [ ] Entity extraction from claims
- [ ] Canonical entity merge (OpenAI variants)
- [ ] Entity pages in UI

### Knowledge Graph
- [ ] Neo4j integration
- [ ] Entity and relationship ingestion from research
- [ ] Graph query API
- [ ] Basic graph visualization in UI

### Visual Dashboards
- [ ] Visualization Engine v1: competitor matrix, funding timeline, trend charts
- [ ] Embedded charts in reports

### Collaboration
- [ ] Shared projects with permissions
- [ ] Comments on reports and findings
- [ ] Activity timeline

## Exit Criteria

- User returns to project weeks later and searches prior research semantically
- Knowledge graph shows entities from multiple runs
- Team member can comment on shared report

## Dependencies

Phase 1 complete.

## Folder Targets

| Area | Path |
|------|------|
| Knowledge | `packages/knowledge/` |
| Visualization | `packages/orchestrator/output/visualization/` |
