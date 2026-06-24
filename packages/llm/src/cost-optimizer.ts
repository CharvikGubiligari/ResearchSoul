import { LlmTaskType } from '@researchsoul/shared';

export interface ModelProfile {
  model: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  maxContext: number;
  qualityTier: number;
  latencyTier: number;
}

/** PDF Module 25 — all model families */
export const MODEL_PROFILES: Record<string, ModelProfile> = {
  'gpt-4o': { model: 'gpt-4o', inputCostPer1M: 2.5, outputCostPer1M: 10, maxContext: 128000, qualityTier: 5, latencyTier: 3 },
  'gpt-4o-mini': { model: 'gpt-4o-mini', inputCostPer1M: 0.15, outputCostPer1M: 0.6, maxContext: 128000, qualityTier: 3, latencyTier: 5 },
  'claude-3-5-sonnet-20241022': { model: 'claude-3-5-sonnet-20241022', inputCostPer1M: 3, outputCostPer1M: 15, maxContext: 200000, qualityTier: 5, latencyTier: 3 },
  'claude-3-haiku-20240307': { model: 'claude-3-haiku-20240307', inputCostPer1M: 0.25, outputCostPer1M: 1.25, maxContext: 200000, qualityTier: 3, latencyTier: 5 },
  'gemini-1.5-pro': { model: 'gemini-1.5-pro', inputCostPer1M: 1.25, outputCostPer1M: 5, maxContext: 1000000, qualityTier: 4, latencyTier: 3 },
  'gemini-1.5-flash': { model: 'gemini-1.5-flash', inputCostPer1M: 0.075, outputCostPer1M: 0.3, maxContext: 1000000, qualityTier: 3, latencyTier: 5 },
  'llama-3.1-70b': { model: 'llama-3.1-70b', inputCostPer1M: 0.59, outputCostPer1M: 0.79, maxContext: 128000, qualityTier: 3, latencyTier: 4 },
  'qwen-2.5-72b': { model: 'qwen-2.5-72b', inputCostPer1M: 0.4, outputCostPer1M: 0.4, maxContext: 128000, qualityTier: 3, latencyTier: 4 },
  'mixtral-8x7b': { model: 'mixtral-8x7b', inputCostPer1M: 0.24, outputCostPer1M: 0.24, maxContext: 32000, qualityTier: 2, latencyTier: 5 },
};

const TASK_MODEL_MAP: Record<LlmTaskType, string[]> = {
  [LlmTaskType.PLANNING]: ['claude-3-5-sonnet-20241022', 'gpt-4o', 'gemini-1.5-pro'],
  [LlmTaskType.EXTRACTION]: ['gpt-4o-mini', 'claude-3-haiku-20240307', 'gemini-1.5-flash'],
  [LlmTaskType.VERIFICATION]: ['gpt-4o-mini', 'claude-3-haiku-20240307'],
  [LlmTaskType.SYNTHESIS]: ['gpt-4o', 'claude-3-5-sonnet-20241022'],
  [LlmTaskType.REPORT]: ['gpt-4o', 'claude-3-5-sonnet-20241022'],
  [LlmTaskType.LONG_CONTEXT]: ['gemini-1.5-pro', 'claude-3-5-sonnet-20241022'],
  [LlmTaskType.CODE]: ['gpt-4o', 'llama-3.1-70b'],
};

export interface CostOptimizerConfig {
  budgetRemaining?: number;
  preferQuality?: boolean;
  preferLatency?: boolean;
  contextSize?: number;
}

/** PDF Module 23 — Cost Optimizer */
export class CostOptimizer {
  selectModel(task: LlmTaskType, config: CostOptimizerConfig = {}): string {
    const candidates = TASK_MODEL_MAP[task] ?? ['gpt-4o-mini'];
    const { budgetRemaining, preferQuality, preferLatency, contextSize } = config;

    let filtered = candidates.filter((m) => {
      const profile = MODEL_PROFILES[m];
      return !contextSize || profile.maxContext >= contextSize;
    });

    if (filtered.length === 0) filtered = ['gpt-4o-mini'];

    if (budgetRemaining !== undefined && budgetRemaining < 0.01) {
      return filtered.find((m) => m.includes('mini') || m.includes('flash') || m.includes('haiku')) ?? filtered[filtered.length - 1];
    }

    if (preferQuality) {
      return filtered.sort((a, b) => MODEL_PROFILES[b].qualityTier - MODEL_PROFILES[a].qualityTier)[0];
    }

    if (preferLatency) {
      return filtered.sort((a, b) => MODEL_PROFILES[b].latencyTier - MODEL_PROFILES[a].latencyTier)[0];
    }

    return filtered.sort((a, b) => {
      const costA = MODEL_PROFILES[a].inputCostPer1M + MODEL_PROFILES[a].outputCostPer1M;
      const costB = MODEL_PROFILES[b].inputCostPer1M + MODEL_PROFILES[b].outputCostPer1M;
      return costA - costB;
    })[0];
  }

  estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    const profile = MODEL_PROFILES[model] ?? MODEL_PROFILES['gpt-4o-mini'];
    return (promptTokens / 1_000_000) * profile.inputCostPer1M + (completionTokens / 1_000_000) * profile.outputCostPer1M;
  }
}

export function selectModelForTask(task: LlmTaskType, config?: CostOptimizerConfig): string {
  return new CostOptimizer().selectModel(task, config);
}
