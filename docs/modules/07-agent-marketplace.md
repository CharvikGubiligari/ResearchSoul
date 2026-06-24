# Module 07 — Agent Marketplace

**Phase:** 1 (core agents), 3 (custom marketplace)

## Design Principle

Every agent is **independent**. Each agent owns:

| Component | Purpose |
|-----------|---------|
| **Tools** | Retrieval, calculators, APIs |
| **Prompt** | System and task prompts |
| **Memory** | Short-term context for run |
| **Planner** | Sub-task decomposition within domain |
| **Validator** | Output quality checks |

## Core Agents (Phase 1)

Market, Competitor, Funding, Customer, Technology, Patent, Academic, News, Financial, Product, Legal, Trend

## Extended Agents (Phase 3)

GitHub, Hiring, Pricing, Security, Compliance, Customer Review

## Agent Contract

```typescript
// Conceptual interface — to be defined in packages/agents
interface ResearchAgent {
  type: string;
  capabilities: string[];
  plan(task: TaskContext): SubTask[];
  execute(subTask: SubTask): EvidenceBundle;
  validate(output: EvidenceBundle): ValidationResult;
}
```

## Folder Structure

```
packages/agents/
├── core/           # Built-in agents
├── registry/       # Agent registration and discovery
└── marketplace/    # Custom user agents (Phase 3)
```
