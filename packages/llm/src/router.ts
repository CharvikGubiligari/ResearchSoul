import OpenAI from 'openai';
import type { LlmUsageLog } from '@researchsoul/shared';
import { LlmTaskType } from '@researchsoul/shared';
import { CostOptimizer, MODEL_PROFILES } from './cost-optimizer';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmRouterConfig {
  apiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  defaultModel?: string;
  mockMode?: boolean;
  budgetRemaining?: number;
}

export interface ChatCompletionResult {
  content: string;
  usage: LlmUsageLog;
  model: string;
}

export class ModelRouter {
  private client: OpenAI | null;
  private defaultModel: string;
  private mockMode: boolean;
  private costOptimizer: CostOptimizer;
  private budgetRemaining?: number;

  constructor(config: LlmRouterConfig = {}) {
    this.defaultModel = config.defaultModel ?? 'gpt-4o-mini';
    this.mockMode = config.mockMode ?? !config.apiKey;
    this.budgetRemaining = config.budgetRemaining;
    this.costOptimizer = new CostOptimizer();
    this.client = config.apiKey
      ? new OpenAI({ apiKey: config.apiKey })
      : null;
  }

  setBudgetRemaining(amount: number) {
    this.budgetRemaining = amount;
  }

  async chatForTask(
    task: LlmTaskType,
    messages: ChatMessage[],
    options?: { contextSize?: number; preferQuality?: boolean },
  ): Promise<ChatCompletionResult> {
    const model = this.costOptimizer.selectModel(task, {
      budgetRemaining: this.budgetRemaining,
      contextSize: options?.contextSize,
      preferQuality: options?.preferQuality,
    });
    return this.chat(messages, model);
  }

  async chat(
    messages: ChatMessage[],
    model?: string,
  ): Promise<ChatCompletionResult> {
    const selectedModel = model ?? this.defaultModel;
    const start = Date.now();

    if (this.mockMode || !this.client) {
      const content =
        '[MOCK LLM] ResearchSoul Phase 0 — configure OPENAI_API_KEY for live responses.';
      return {
        content,
        model: selectedModel,
        usage: {
          model: selectedModel,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0,
          latencyMs: Date.now() - start,
        },
      };
    }

    const response = await this.client.chat.completions.create({
      model: selectedModel,
      messages,
    });

    const choice = response.choices[0]?.message?.content ?? '';
    const promptTokens = response.usage?.prompt_tokens ?? 0;
    const completionTokens = response.usage?.completion_tokens ?? 0;
    const totalTokens = response.usage?.total_tokens ?? 0;

    return {
      content: choice,
      model: selectedModel,
      usage: {
        model: selectedModel,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd: this.estimateCost(
          selectedModel,
          promptTokens,
          completionTokens,
        ),
        latencyMs: Date.now() - start,
      },
    };
  }

  private estimateCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    return this.costOptimizer.estimateCost(model, promptTokens, completionTokens);
  }
}
