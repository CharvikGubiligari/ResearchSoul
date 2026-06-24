import type { ModelRouter } from '@researchsoul/llm';
import type { RetrievalConfig } from '@researchsoul/retrieval';
import {
  CitationStyle,
  CitationMode,
  ResearchStatus,
  type ExecutionDAG,
  type ResearchProgressEvent,
} from '@researchsoul/shared';
import { EvidencePipeline } from '@researchsoul/evidence';
import { ResearchPlanner, getParallelBatches } from './planner';
import { AgentManager, buildAgentContext } from './agent-manager';
import { ReportGenerator } from './report-generator';
import { ReportExporter } from './exporter';
import type { EvidenceBundle } from '@researchsoul/shared';
import type { NormalizedDocument } from '@researchsoul/shared';

export interface ResearchRunInput {
  researchId: string;
  objective: string;
  researchType: string;
  depth: import('@researchsoul/shared').ResearchDepth;
  outputType: import('@researchsoul/shared').ResearchOutputType;
  budget?: number;
  language?: string;
  country?: string;
  customInstructions?: string;
  citationStyle?: CitationStyle;
  citationMode?: CitationMode;
}

export interface ResearchRunResult {
  dag: ExecutionDAG;
  evidence: Awaited<ReturnType<EvidencePipeline['process']>>;
  report: Awaited<ReturnType<ReportGenerator['generate']>>;
  agentBundles: EvidenceBundle[];
  totalCost: number;
}

export type ProgressCallback = (event: ResearchProgressEvent) => void | Promise<void>;

/** PDF Modules 4–6, 10, 20 — full research orchestration */
export class ResearchOrchestrator {
  private planner: ResearchPlanner;
  private agentManager: AgentManager;
  private evidencePipeline: EvidencePipeline;
  private reportGenerator: ReportGenerator;
  private exporter: ReportExporter;
  private totalCost = 0;
  private cancelled = new Set<string>();

  constructor(
    private llm: ModelRouter,
    retrievalConfig: RetrievalConfig = {},
  ) {
    this.planner = new ResearchPlanner(llm);
    this.agentManager = new AgentManager(llm, retrievalConfig);
    this.evidencePipeline = new EvidencePipeline(llm);
    this.reportGenerator = new ReportGenerator(llm);
    this.exporter = new ReportExporter();
  }

  cancel(researchId: string) {
    this.cancelled.add(researchId);
  }

  async run(input: ResearchRunInput, onProgress?: ProgressCallback): Promise<ResearchRunResult> {
    const emit = async (phase: string, progress: number, message: string, extra?: Partial<ResearchProgressEvent>) => {
      await onProgress?.({
        researchId: input.researchId,
        status: ResearchStatus.RUNNING,
        phase,
        progress,
        message,
        timestamp: new Date().toISOString(),
        ...extra,
      });
    };

    if (this.cancelled.has(input.researchId)) throw new Error('Research cancelled');

    await emit('planning', 5, 'Generating research plan (DAG)...');
    const dag = await this.planner.plan({
      objective: input.objective,
      researchType: input.researchType,
      depth: input.depth,
      country: input.country,
      language: input.language,
      customInstructions: input.customInstructions,
    });

    const batches = getParallelBatches(dag);
    const allDocuments: NormalizedDocument[] = [];
    const agentBundles: EvidenceBundle[] = [];
    let taskProgress = 10;

    for (const batch of batches) {
      if (this.cancelled.has(input.researchId)) throw new Error('Research cancelled');

      await Promise.all(
        batch.map(async (node) => {
          await emit('execution', taskProgress, `Running ${node.agentType} agent...`, {
            agentType: node.agentType,
            taskId: node.id,
          });

          const context = buildAgentContext(input.researchId, node.id, node, {
            language: input.language,
            country: input.country,
            customInstructions: input.customInstructions,
          });

          try {
            const bundle = await this.agentManager.dispatch(context);
            agentBundles.push(bundle);
            allDocuments.push(...bundle.documents);
          } catch (err) {
            await emit('execution', taskProgress, `Agent ${node.agentType} failed: ${err instanceof Error ? err.message : 'error'}`, {
              agentType: node.agentType,
              taskId: node.id,
            });
          }
        }),
      );

      taskProgress = Math.min(70, taskProgress + Math.floor(60 / batches.length));
    }

    await emit('synthesis', 75, 'Processing evidence pipeline...');
    const evidence = await this.evidencePipeline.process(
      allDocuments,
      input.citationStyle ?? CitationStyle.APA,
      input.citationMode ?? CitationMode.INLINE,
    );

    await emit('report', 85, 'Generating report...');
    const report = await this.reportGenerator.generate({
      objective: input.objective,
      researchType: input.researchType as import('@researchsoul/shared').ResearchType,
      outputType: input.outputType,
      evidence,
      citationStyle: input.citationStyle ?? CitationStyle.APA,
    });

    await emit('completed', 100, 'Research complete', { status: ResearchStatus.COMPLETED });

    return { dag, evidence, report, agentBundles, totalCost: this.totalCost };
  }

  getExporter() {
    return this.exporter;
  }
}

export { ResearchPlanner, getParallelBatches, topologicalSort } from './planner';
export { AgentManager, buildAgentContext } from './agent-manager';
export { ReportGenerator } from './report-generator';
export { ReportExporter } from './exporter';
