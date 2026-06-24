import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import {
  ResearchStatus,
  ExecutionStatus,
  TaskStatus,
  AgentRunStatus,
  UsageEventType,
  ReportFormat,
} from '@prisma/client';
import { ModelRouter } from '@researchsoul/llm';
import { ResearchOrchestrator } from '@researchsoul/orchestrator';
import { PrismaService } from '../../prisma/prisma.service';
import { ResearchService } from './research.service';
import { BillingService } from '../billing/billing.service';
import { StorageService } from '../storage/storage.service';
import { RESEARCH_QUEUE, ResearchJobData } from './research.constants';

@Processor(RESEARCH_QUEUE)
export class ResearchProcessor extends WorkerHost {
  private readonly logger = new Logger(ResearchProcessor.name);

  constructor(
    private prisma: PrismaService,
    private researchService: ResearchService,
    private billing: BillingService,
    private storage: StorageService,
    private config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<ResearchJobData>) {
    const { researchId, organizationId } = job.data;
    this.logger.log(JSON.stringify({ event: 'research_start', researchId, jobId: job.id }));

    const research = await this.prisma.research.findUnique({ where: { id: researchId } });
    if (!research) throw new Error('Research not found');

    const execution = await this.prisma.execution.findFirst({
      where: { researchId },
      orderBy: { createdAt: 'desc' },
    });
    if (!execution) throw new Error('Execution not found');

    const budget = research.budget ? Number(research.budget) : undefined;
    const spent = Number(research.spent);

    const llm = new ModelRouter({
      apiKey: this.config.get('OPENAI_API_KEY'),
      mockMode: !this.config.get('OPENAI_API_KEY'),
      budgetRemaining: budget ? budget - spent : undefined,
    });

    const orchestrator = new ResearchOrchestrator(llm, {
      tavilyApiKey: this.config.get('TAVILY_API_KEY'),
      exaApiKey: this.config.get('EXA_API_KEY'),
      firecrawlApiKey: this.config.get('FIRECRAWL_API_KEY'),
      jinaApiKey: this.config.get('JINA_API_KEY'),
      githubToken: this.config.get('GITHUB_TOKEN'),
      newsApiKey: this.config.get('NEWS_API_KEY'),
    });

    await this.prisma.execution.update({
      where: { id: execution.id },
      data: { status: ExecutionStatus.RUNNING, startedAt: new Date() },
    });

    try {
      const result = await orchestrator.run(
        {
          researchId,
          objective: research.objective,
          researchType: research.researchType,
          depth: research.depth,
          outputType: research.outputType,
          budget,
          language: research.language,
          country: research.country ?? undefined,
          customInstructions: research.customInstructions ?? undefined,
          citationStyle: research.citationStyle,
          citationMode: research.citationMode,
        },
        (event) => this.researchService.publishProgress(event),
      );

      await this.prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.SYNTHESIZING,
          dag: result.dag as object,
          progress: 80,
        },
      });

      for (const node of result.dag.nodes) {
        await this.prisma.task.create({
          data: {
            executionId: execution.id,
            nodeId: node.id,
            question: node.question,
            subQuestion: node.subQuestion,
            agentType: node.agentType,
            sourceTypes: node.sourceTypes,
            expectedOutput: node.expectedOutput,
            dependencies: node.dependencies,
            status: TaskStatus.COMPLETED,
          },
        });
      }

      for (const doc of result.evidence.documents) {
        const savedDoc = await this.prisma.document.create({
          data: {
            researchId,
            title: doc.title,
            author: doc.metadata.author,
            publisher: doc.metadata.publisher,
            publishedAt: doc.metadata.timestamp ? new Date(doc.metadata.timestamp) : undefined,
            documentType: doc.metadata.type as import('@prisma/client').DocumentType,
            language: doc.metadata.language,
            url: doc.metadata.url,
            content: doc.content,
            license: doc.metadata.license,
            reliability: doc.metadata.reliability,
          },
        });
        doc.id = savedDoc.id;
      }

      for (const claim of result.evidence.claims) {
        const savedClaim = await this.prisma.claim.create({
          data: {
            researchId,
            text: claim.text,
            confidence: claim.confidence,
            verificationStatus: claim.verificationStatus as import('@prisma/client').VerificationStatus,
          },
        });

        for (const ev of claim.evidence) {
          const doc = await this.prisma.document.findFirst({
            where: { researchId, id: ev.documentId },
          });
          if (doc) {
            await this.prisma.evidence.create({
              data: {
                claimId: savedClaim.id,
                documentId: doc.id,
                span: ev.excerpt,
                excerpt: ev.excerpt,
                citation: ev.citation,
                isPrimary: true,
              },
            });
          }
        }
      }

      for (const c of result.evidence.contradictions) {
        const claimA = await this.prisma.claim.findFirst({ where: { researchId, text: c.claimAText } });
        const claimB = await this.prisma.claim.findFirst({ where: { researchId, text: c.claimBText } });
        if (claimA && claimB) {
          await this.prisma.contradiction.create({
            data: {
              claimAId: claimA.id,
              claimBId: claimB.id,
              reason: c.reason,
              alternativeViewpoints: c.alternativeViewpoints,
              adjustedConfidence: c.adjustedConfidence,
            },
          });
        }
      }

      const report = await this.prisma.report.create({
        data: {
          researchId,
          title: result.report.title,
          outputType: research.outputType,
          format: ReportFormat.MARKDOWN,
          executiveSummary: result.report.executiveSummary,
          content: result.report.content,
          bibliography: result.report.bibliography,
        },
      });

      const exporter = orchestrator.getExporter();
      const mdExport = exporter.export({
        title: result.report.title,
        executiveSummary: result.report.executiveSummary,
        content: result.report.content,
        bibliography: result.report.bibliography,
        format: ReportFormat.MARKDOWN,
      });

      const s3Key = `reports/${researchId}/${report.id}.md`;
      await this.storage.upload(s3Key, mdExport.data as string, 'text/markdown');
      await this.prisma.report.update({ where: { id: report.id }, data: { s3Key } });

      await this.prisma.research.update({
        where: { id: researchId },
        data: {
          status: ResearchStatus.COMPLETED,
          progress: 100,
          completedAt: new Date(),
        },
      });

      await this.prisma.execution.update({
        where: { id: execution.id },
        data: { status: ExecutionStatus.COMPLETED, progress: 100, completedAt: new Date() },
      });

      await this.billing.recordUsage(organizationId, UsageEventType.RESEARCH_RUN, 1, { researchId });
      await this.researchService.updateStatus(researchId, ResearchStatus.COMPLETED, 100, 'Research complete');

      return { reportId: report.id };
    } catch (err) {
      this.logger.error(JSON.stringify({ event: 'research_failed', researchId, error: String(err) }));
      await this.prisma.research.update({
        where: { id: researchId },
        data: { status: ResearchStatus.FAILED },
      });
      await this.prisma.execution.update({
        where: { id: execution.id },
        data: { status: ExecutionStatus.FAILED },
      });
      throw err;
    }
  }
}
