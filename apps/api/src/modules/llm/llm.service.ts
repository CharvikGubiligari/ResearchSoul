import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import {
  ModelRouter,
  loadPromptTemplate,
  renderPrompt,
} from '@researchsoul/llm';
import { UsageEventType } from '@prisma/client';
import { BillingService } from '../billing/billing.service';
import { LlmChatDto } from './dto/llm.dto';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private router: ModelRouter;
  private promptsDir: string;

  constructor(
    private config: ConfigService,
    private billing: BillingService,
  ) {
    this.router = new ModelRouter({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
      defaultModel: this.config.get<string>('LLM_DEFAULT_MODEL') ?? 'gpt-4o-mini',
      mockMode: !this.config.get<string>('OPENAI_API_KEY'),
    });
    this.promptsDir = path.join(__dirname, '..', 'prompts');
  }

  async chat(dto: LlmChatDto, userId: string) {
    const template = loadPromptTemplate(this.promptsDir, 'health-check');
    const prompt = renderPrompt(template.content, { message: dto.message });

    const result = await this.router.chat([
      { role: 'system', content: 'You are ResearchSoul assistant.' },
      { role: 'user', content: prompt },
    ]);

    this.logger.log(
      JSON.stringify({
        event: 'llm_call',
        userId,
        model: result.model,
        usage: result.usage,
      }),
    );

    if (dto.organizationId) {
      await this.billing.recordUsage(
        dto.organizationId,
        UsageEventType.LLM_TOKENS,
        result.usage.estimatedCostUsd,
        {
          model: result.model,
          totalTokens: result.usage.totalTokens,
          latencyMs: result.usage.latencyMs,
        },
      );
    }

    return {
      content: result.content,
      model: result.model,
      usage: result.usage,
    };
  }
}
