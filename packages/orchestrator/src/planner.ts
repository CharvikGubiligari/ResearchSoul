import type { ModelRouter, PromptManager } from '@researchsoul/llm';
import { LlmTaskType } from '@researchsoul/shared';
import {
  AgentType,
  SourceType,
  ResearchDepth,
  type ExecutionDAG,
  type DAGNode,
} from '@researchsoul/shared';
import { getAgentCapabilities, AGENT_REGISTRY } from '@researchsoul/agents';

export interface PlanningInput {
  objective: string;
  researchType: string;
  depth: ResearchDepth;
  country?: string;
  language?: string;
  customInstructions?: string;
}

/** PDF Module 4 — Research Planning Engine (DAG) */
export class ResearchPlanner {
  constructor(
    private llm: ModelRouter,
    private prompts?: PromptManager,
  ) {}

  async plan(input: PlanningInput): Promise<ExecutionDAG> {
    const agentList = AGENT_REGISTRY.map((a) => `${a.type}: ${a.capabilities.join(', ')}`).join('\n');

    const systemPrompt = this.prompts?.render('research-planner', {
      objective: input.objective,
      researchType: input.researchType,
      depth: input.depth,
      agents: agentList,
    }) ?? `You are ResearchSoul Planner. Create a research execution DAG as JSON:
{"nodes":[{"id":"q1","question":"...","subQuestion":"...","agentType":"MARKET","sourceTypes":["GOOGLE","NEWS"],"expectedOutput":"...","dependencies":[]}],"edges":[{"from":"q1","to":"q2"}]}
Use agent types: ${Object.values(AgentType).join(', ')}.
Use source types: ${Object.values(SourceType).join(', ')}.
Objective: ${input.objective}. Depth: ${input.depth}.`;

    const result = await this.llm.chatForTask(LlmTaskType.PLANNING, [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Plan research for: "${input.objective}"\nType: ${input.researchType}\n${input.customInstructions ?? ''}`,
      },
    ], { preferQuality: true });

    try {
      const json = result.content.match(/\{[\s\S]*\}/)?.[0] ?? '{}';
      const dag = JSON.parse(json) as ExecutionDAG;
      return this.validateAndFixDAG(dag, input);
    } catch {
      return this.fallbackDAG(input);
    }
  }

  validateDAG(dag: ExecutionDAG): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const ids = new Set(dag.nodes.map((n) => n.id));

    for (const node of dag.nodes) {
      if (!Object.values(AgentType).includes(node.agentType)) {
        errors.push(`Invalid agent type: ${node.agentType}`);
      }
      for (const dep of node.dependencies) {
        if (!ids.has(dep)) errors.push(`Missing dependency: ${dep}`);
      }
    }

    if (this.hasCycle(dag)) errors.push('DAG contains cycle');

    return { valid: errors.length === 0, errors };
  }

  private validateAndFixDAG(dag: ExecutionDAG, input: PlanningInput): ExecutionDAG {
    if (!dag.nodes?.length) return this.fallbackDAG(input);

    const nodes: DAGNode[] = dag.nodes.map((n, i) => ({
      id: n.id ?? `task-${i}`,
      question: n.question ?? input.objective,
      subQuestion: n.subQuestion,
      agentType: Object.values(AgentType).includes(n.agentType) ? n.agentType : AgentType.MARKET,
      sourceTypes: (n.sourceTypes ?? []).filter((s) => Object.values(SourceType).includes(s)),
      expectedOutput: n.expectedOutput ?? 'Findings',
      dependencies: n.dependencies ?? [],
    }));

    for (const node of nodes) {
      if (node.sourceTypes.length === 0) {
        node.sourceTypes = getAgentCapabilities(node.agentType).defaultSources;
      }
    }

    const edges = dag.edges ?? nodes.flatMap((n) =>
      n.dependencies.map((dep) => ({ from: dep, to: n.id })),
    );

    const fixed = { nodes, edges };
    const validation = this.validateDAG(fixed);
    if (!validation.valid) return this.fallbackDAG(input);
    return fixed;
  }

  private fallbackDAG(input: PlanningInput): ExecutionDAG {
    const depth = input.depth;
    const nodeCount = depth === ResearchDepth.QUICK_SCAN ? 4 : depth === ResearchDepth.DEEP_DIVE ? 12 : 8;
    const agentTypes = Object.values(AgentType).slice(0, nodeCount);

    const nodes: DAGNode[] = agentTypes.map((agentType, i) => {
      const caps = getAgentCapabilities(agentType);
      return {
        id: `task-${i + 1}`,
        question: input.objective,
        subQuestion: `${caps.name}: analyze ${input.objective}`,
        agentType,
        sourceTypes: caps.defaultSources,
        expectedOutput: caps.capabilities.join(', '),
        dependencies: i > 0 && i % 3 === 0 ? [`task-${i}`] : [],
      };
    });

    return {
      nodes,
      edges: nodes.flatMap((n) => n.dependencies.map((dep) => ({ from: dep, to: n.id }))),
    };
  }

  private hasCycle(dag: ExecutionDAG): boolean {
    const visited = new Set<string>();
    const stack = new Set<string>();
    const adj = new Map<string, string[]>();
    for (const n of dag.nodes) adj.set(n.id, n.dependencies);

    const dfs = (id: string): boolean => {
      if (stack.has(id)) return true;
      if (visited.has(id)) return false;
      visited.add(id);
      stack.add(id);
      for (const dep of adj.get(id) ?? []) {
        if (dfs(dep)) return true;
      }
      stack.delete(id);
      return false;
    };

    return dag.nodes.some((n) => dfs(n.id));
  }
}

export function topologicalSort(dag: ExecutionDAG): DAGNode[] {
  const inDegree = new Map<string, number>();
  const nodes = new Map(dag.nodes.map((n) => [n.id, n]));

  for (const n of dag.nodes) inDegree.set(n.id, n.dependencies.length);

  const ready = dag.nodes.filter((n) => n.dependencies.length === 0);
  const sorted: DAGNode[] = [];

  while (ready.length) {
    const node = ready.shift()!;
    sorted.push(node);
    for (const other of dag.nodes) {
      if (other.dependencies.includes(node.id)) {
        inDegree.set(other.id, (inDegree.get(other.id) ?? 1) - 1);
        if (inDegree.get(other.id) === 0) ready.push(other);
      }
    }
  }

  return sorted.length === dag.nodes.length ? sorted : dag.nodes;
}

export function getParallelBatches(dag: ExecutionDAG): DAGNode[][] {
  const sorted = topologicalSort(dag);
  const completed = new Set<string>();
  const batches: DAGNode[][] = [];

  while (completed.size < sorted.length) {
    const batch = sorted.filter(
      (n) => !completed.has(n.id) && n.dependencies.every((d) => completed.has(d)),
    );
    if (!batch.length) break;
    batches.push(batch);
    batch.forEach((n) => completed.add(n.id));
  }

  return batches;
}
