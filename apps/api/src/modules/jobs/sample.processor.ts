import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SAMPLE_QUEUE, SampleJobData, SampleJobResult } from './jobs.constants';

@Processor(SAMPLE_QUEUE)
export class SampleProcessor extends WorkerHost {
  private readonly logger = new Logger(SampleProcessor.name);

  async process(job: Job<SampleJobData>): Promise<SampleJobResult> {
    this.logger.log(
      JSON.stringify({
        jobId: job.id,
        name: job.name,
        data: job.data,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      processedAt: new Date().toISOString(),
      echo: job.data.message,
    };
  }
}
