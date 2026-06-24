import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { LlmService } from './llm.service';
import { LlmChatDto } from './dto/llm.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('llm')
@UseGuards(JwtAuthGuard)
export class LlmController {
  constructor(private llmService: LlmService) {}

  @Post('chat')
  chat(@Req() req: Request, @Body() dto: LlmChatDto) {
    return this.llmService.chat(dto, (req.user as { id: string }).id);
  }
}
