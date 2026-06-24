# Core Data Model

The canonical hierarchy defines ownership, permissions, and the research artifact chain.

## Entity Hierarchy

```
Organization
  └── Workspace
        └── Project
              └── Research (Research Request / Run)
                    └── Execution
                          └── Tasks (DAG nodes)
                                └── Agents (task assignments)
                                      └── Sources
                                            └── Documents (normalized)
                                                  └── Claims
                                                        └── Evidence
                                                              └── Entities
                                                                    └── Knowledge Graph
                                                                          └── Reports
```

## Entity Definitions

### Organization
Top-level tenant. Owns billing, teams, RBAC, API keys.

### Workspace
Logical container for projects. Supports folders, tags, archives, templates, shared access, permissions, version history, activity timeline.

### Project
Persistent research container (Phase 2+). Holds multiple research runs, memory, and collaboration context.

### Research
A single research request/run. Captures objective, type, depth, budget, deadline, language, country, audience, output type, custom instructions, priority.

### Execution
One workflow run for a Research. Tracks status, progress, DAG snapshot, checkpoints.

### Task
A node in the execution DAG. Has dependencies, assigned agent(s), required sources, expected output, timeout/retry config.

### Agent
Runtime instance of an agent type. Tracks health, state, resource usage, communication logs.

### Source
Raw or retrieved reference (URL, API result, uploaded file). Pre-normalization.

### Document
Normalized source with metadata: author, publisher, timestamp, type, language, URL, content, license, reliability score.

### Claim
Atomic factual statement extracted from one or more documents.

### Evidence
Supporting material for a claim. Links claim ↔ source(s). May have multiple evidence records per claim.

### Entity
Resolved real-world object: Company, Person, Product, Market, Technology, Investor, Country, Regulation.

Entity Resolution merges variants (e.g., "OpenAI", "Open AI", "OpenAI Inc.").

### Knowledge Graph
Graph of entities and typed relationships. Stored in Neo4j; indexed for queries and visualization.

### Report
Generated output artifact: executive summary, deep report, memo, presentation. Versioned; exportable to PDF/Markdown/DOCX/PPT.

## Key Relationships

| From | To | Relationship |
|------|-----|--------------|
| Claim | Evidence | supported_by (1:N) |
| Evidence | Source/Document | derived_from (N:1) |
| Entity | Entity | typed edges (invested_in, competes_with, founded_by, etc.) |
| Research | Report | produces (1:N) |
| User | Organization | member_of |
| Project | Research | contains (1:N) |

## Storage Mapping

| Entity Group | Primary Store |
|--------------|---------------|
| Org, Workspace, Project, Research, Execution, Task, User, Billing | PostgreSQL (Prisma) |
| Documents, Reports (files) | S3-compatible object storage |
| Claims, Evidence, Sources (metadata) | PostgreSQL |
| Entities, Relationships | Neo4j |
| Embeddings, semantic chunks | pgvector → dedicated vector DB |
| Execution queues, cache, sessions | Redis |
| Job orchestration | BullMQ |
