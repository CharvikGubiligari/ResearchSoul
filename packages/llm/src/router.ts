import OpenAI from 'openai';
import type { LlmUsageLog } from '@researchsoul/shared';

/** Approximate USD per 1M tokens — update as pricing changes */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4-turbo': { input: 10, output: 30 },
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmRouterConfig {
  apiKey?: string;
  defaultModel?: string;
  mockMode?: boolean;
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

  constructor(config: LlmRouterConfig = {}) {
    this.defaultModel = config.defaultModel ?? 'gpt-4o-mini';
    this.mockMode = config.mockMode ?? !config.apiKey;
    this.client = config.apiKey
      ? new OpenAI({ apiKey: config.apiKey })
      : null;
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
    const pricing = MODEL_PRICING[model] ?? MODEL_PRICING['gpt-4o-mini'];
    const inputCost = (promptTokens / 1_000_000) * pricing.input;
    const outputCost = (completionTokens / 1_000_000) * pricing.output;
    return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
  }
}
