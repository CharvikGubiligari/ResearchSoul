import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import {
  ResearchStatus,
  ExecutionStatus,
  TaskStatus,
  AgentRunStatus,
  UsageEventType,
  ReportFormat,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { BillingService } from '../billing/billing.service';
import { RESEARCH_QUEUE, RESEARCH_PROGRESS_CHANNEL, ResearchJobData } from './research.constants';
import { CreateResearchDto, ExportReportDto } from './dto/research.dto';
import type { ResearchProgressEvent } from '@researchsoul/shared';

@Injectable()
export class ResearchService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private storage: StorageService,
    private billing: BillingService,
    private config: ConfigService,
    @InjectQueue(RESEARCH_QUEUE) private researchQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateResearchDto) {
    await this.assertProjectAccess(userId, dto.projectId);

    const research = await this.prisma.research.create({
      data: {
        projectId: dto.projectId,
        objective: dto.objective,
        researchType: dto.researchType,
        depth: dto.depth,
        budget: dto.budget,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        language: dto.language ?? 'en',
        country: dto.country,
        audience: dto.audience,
        outputType: dto.outputType,
        customInstructions: dto.customInstructions,
        priority: dto.priority ?? 'NORMAL',
        citationStyle: dto.citationStyle ?? 'APA',
        citationMode: dto.citationMode ?? 'INLINE',
        status: ResearchStatus.PENDING,
      },
    });

    const execution = await this.prisma.execution.create({
      data: {
        researchId: research.id,
        status: ExecutionStatus.PENDING,
      },
    });

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      include: { workspace: true },
    });

    await this.researchQueue.add(
      'run',
      {
        researchId: research.id,
        userId,
        organizationId: project!.workspace.organizationId,
      } satisfies ResearchJobData,
      {
        priority: dto.priority === 'URGENT' ? 1 : dto.priority === 'HIGH' ? 2 : 3,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    await this.updateStatus(research.id, ResearchStatus.PLANNING, 0, 'Research queued');

    return { research, executionId: execution.id };
  }

  async listByProject(userId: string, projectId: string) {
    await this.assertProjectAccess(userId, projectId);
    return this.prisma.research.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        reports: { take: 1, orderBy: { createdAt: 'desc' } },
        executions: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async getById(userId: string, researchId: string) {
    const research = await this.prisma.research.findUnique({
      where: { id: researchId },
      include: {
        project: { include: { workspace: true } },
        executions: { orderBy: { createdAt: 'desc' }, take: 1 },
        reports: { orderBy: { createdAt: 'desc' } },
        claims: {
          include: {
            evidence: { include: { document: true } },
            contradictions: true,
            contradictedBy: true,
          },
        },
      },
    });

    if (!research) throw new NotFoundException('Research not found');
    await this.assertProjectAccess(userId, research.projectId);
    return research;
  }

  async cancel(userId: string, researchId: string) {
    const research = await this.getById(userId, researchId);
    if ([ResearchStatus.COMPLETED, ResearchStatus.CANCELLED].includes(research.status)) {
      throw new BadRequestException('Research already finished');
    }

    await this.redis.getClient().publish(
      `${RESEARCH_PROGRESS_CHANNEL}${researchId}`,
      JSON.stringify({ action: 'cancel' }),
    );

    await this.prisma.research.update({
      where: { id: researchId },
      data: { status: ResearchStatus.CANCELLED },
    });

    return { cancelled: true };
  }

  async getProgress(researchId: string): Promise<ResearchProgressEvent[]> {
    const key = `research:events:${researchId}`;
    const events = await this.redis.getClient().lrange(key, 0, -1);
    return events.map((e) => JSON.parse(e) as ResearchProgressEvent);
  }

  async publishProgress(event: ResearchProgressEvent) {
    const key = `research:events:${event.researchId}`;
    const client = this.redis.getClient();
    await client.rpush(key, JSON.stringify(event));
    await client.expire(key, 86400);
    await client.publish(`${RESEARCH_PROGRESS_CHANNEL}${event.researchId}`, JSON.stringify(event));

    await this.prisma.research.update({
      where: { id: event.researchId },
      data: {
        status: event.status as ResearchStatus,
        progress: event.progress,
      },
    });
  }

  async updateStatus(researchId: string, status: ResearchStatus, progress: number, message: string) {
    await this.publishProgress({
      researchId,
      status: status as import('@researchsoul/shared').ResearchStatus,
      phase: status.toLowerCase(),
      progress,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  async exportReport(userId: string, reportId: string, dto: ExportReportDto) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { research: { include: { project: true } } },
    });
    if (!report) throw new NotFoundException('Report not found');
    await this.assertProjectAccess(userId, report.research.projectId);

    const { ReportExporter } = await import('@researchsoul/orchestrator');
    const exporter = new ReportExporter();
    const result = exporter.export({
      title: report.title,
      executiveSummary: report.executiveSummary ?? '',
      content: report.content,
      bibliography: report.bibliography,
      format: dto.format,
    });

    const key = `exports/${report.researchId}/${report.id}.${result.extension}`;
    await this.storage.upload(key, typeof result.data === 'string' ? result.data : result.data, result.contentType);

    return {
      key,
      contentType: result.contentType,
      extension: result.extension,
      data: result.data,
    };
  }

  async listAgents() {
    const { AGENT_REGISTRY } = await import('@researchsoul/agents');
    return AGENT_REGISTRY;
  }

  async listRetrievalSources() {
    const { RetrievalService } = await import('@researchsoul/retrieval');
    const service = new RetrievalService({
      tavilyApiKey: this.config.get('TAVILY_API_KEY'),
      exaApiKey: this.config.get('EXA_API_KEY'),
      githubToken: this.config.get('GITHUB_TOKEN'),
    });
    return service.listSupportedSources();
  }

  private async assertProjectAccess(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { organization: { include: { members: true } } } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    const isMember = project.workspace.organization.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Access denied');
    return project;
  }
}
