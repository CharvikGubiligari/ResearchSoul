import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  Sse,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { ResearchService } from './research.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateResearchDto, ExportReportDto } from './dto/research.dto';
import { RedisService } from '../../common/redis/redis.service';
import { RESEARCH_PROGRESS_CHANNEL } from './research.constants';
import type { ResearchProgressEvent } from '@researchsoul/shared';

@Controller()
@UseGuards(JwtAuthGuard)
export class ResearchController {
  constructor(
    private researchService: ResearchService,
    private redis: RedisService,
  ) {}

  /** PDF Module 3 — Research Request (all intake fields) */
  @Post('research')
  create(@Req() req: Request, @Body() dto: CreateResearchDto) {
    return this.researchService.create((req.user as { id: string }).id, dto);
  }

  @Get('projects/:projectId/research')
  listByProject(@Req() req: Request, @Param('projectId') projectId: string) {
    return this.researchService.listByProject((req.user as { id: string }).id, projectId);
  }

  @Get('research/:researchId')
  getById(@Req() req: Request, @Param('researchId') researchId: string) {
    return this.researchService.getById((req.user as { id: string }).id, researchId);
  }

  @Post('research/:researchId/cancel')
  cancel(@Req() req: Request, @Param('researchId') researchId: string) {
    return this.researchService.cancel((req.user as { id: string }).id, researchId);
  }

  @Get('research/:researchId/progress')
  getProgress(@Param('researchId') researchId: string) {
    return this.researchService.getProgress(researchId);
  }

  /** SSE progress stream — PDF Workflow Engine */
  @Sse('research/:researchId/stream')
  streamProgress(@Param('researchId') researchId: string): Observable<{ data: ResearchProgressEvent }> {
    return new Observable((subscriber) => {
      const subscriber_client = this.redis.getClient().duplicate();
      const channel = `${RESEARCH_PROGRESS_CHANNEL}${researchId}`;

      subscriber_client.subscribe(channel);
      subscriber_client.on('message', (_ch, message) => {
        try {
          subscriber.next({ data: JSON.parse(message) as ResearchProgressEvent });
        } catch {
          /* ignore */
        }
      });

      this.researchService.getProgress(researchId).then((events) => {
        for (const event of events) {
          subscriber.next({ data: event });
        }
      });

      return () => {
        subscriber_client.unsubscribe(channel);
        subscriber_client.disconnect();
      };
    });
  }

  @Post('reports/:reportId/export')
  async exportReport(
    @Req() req: Request,
    @Param('reportId') reportId: string,
    @Body() dto: ExportReportDto,
    @Res() res: Response,
  ) {
    const result = await this.researchService.exportReport(
      (req.user as { id: string }).id,
      reportId,
      dto,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="report.${result.extension}"`);
    res.send(result.data);
  }

  /** PDF Module 7 — Agent registry */
  @Get('agents')
  listAgents() {
    return this.researchService.listAgents();
  }

  /** PDF Module 8 — Retrieval sources */
  @Get('retrieval/sources')
  listSources() {
    return this.researchService.listRetrievalSources();
  }
}
