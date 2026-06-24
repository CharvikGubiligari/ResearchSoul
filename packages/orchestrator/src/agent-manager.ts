import { AgentType, type AgentTaskContext, type EvidenceBundle } from '@researchsoul/shared';
import { createAgent, getAgentCapabilities, AGENT_REGISTRY, type BaseResearchAgent } from '@researchsoul/agents';
import type { ModelRouter } from '@researchsoul/llm';
import type { RetrievalConfig } from '@researchsoul/retrieval';

export interface AgentRunRecord {
  id: string;
  agentType: AgentType;
  taskId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  health: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

/** PDF Module 6 — Agent Manager */
export class AgentManager {
  private registry = new Map<AgentType, BaseResearchAgent>();
  private runs = new Map<string, AgentRunRecord>();
  private maxConcurrency: number;

  constructor(
    private llm: ModelRouter,
    private retrievalConfig: RetrievalConfig = {},
    maxConcurrency = 4,
  ) {
    this.maxConcurrency = maxConcurrency;
    for (const cap of AGENT_REGISTRY) {
      this.registry.set(cap.type, createAgent(cap.type, llm, retrievalConfig));
    }
  }

  listAgents() {
    return AGENT_REGISTRY;
  }

  async dispatch(context: AgentTaskContext, retries = 2): Promise<EvidenceBundle> {
    const runId = `${context.taskId}-${context.researchId}`;
    const record: AgentRunRecord = {
      id: runId,
      agentType: context.agentType,
      taskId: context.taskId,
      status: 'RUNNING',
      health: 'healthy',
      startedAt: new Date(),
    };
    this.runs.set(runId, record);

    const agent = this.registry.get(context.agentType);
    if (!agent) throw new Error(`Agent not found: ${context.agentType}`);

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await agent.execute(context);
        record.status = 'COMPLETED';
        record.completedAt = new Date();
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        record.health = 'degraded';
        if (attempt < retries) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    record.status = 'FAILED';
    record.error = lastError?.message;
    record.completedAt = new Date();
    throw lastError;
  }

  getStatus(runId: string): AgentRunRecord | undefined {
    return this.runs.get(runId);
  }

  getHealth(): { total: number; running: number; failed: number } {
    const runs = [...this.runs.values()];
    return {
      total: runs.length,
      running: runs.filter((r) => r.status === 'RUNNING').length,
      failed: runs.filter((r) => r.status === 'FAILED').length,
    };
  }
}

export function buildAgentContext(
  researchId: string,
  taskId: string,
  node: { question: string; subQuestion?: string; agentType: AgentType; sourceTypes: import('@researchsoul/shared').SourceType[] },
  extras: Partial<AgentTaskContext> = {},
): AgentTaskContext {
  return {
    researchId,
    taskId,
    agentType: node.agentType,
    question: node.question,
    subQuestion: node.subQuestion,
    sourceTypes: node.sourceTypes,
    ...extras,
  };
}
