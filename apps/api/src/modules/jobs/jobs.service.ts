import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SAMPLE_QUEUE, SampleJobData } from './jobs.constants';
import { JobStatus } from '@researchsoul/shared';

@Injectable()
export class JobsService {
  constructor(@InjectQueue(SAMPLE_QUEUE) private sampleQueue: Queue) {}

  async enqueueSample(data: SampleJobData) {
    const job = await this.sampleQueue.add('process', data, {
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    return {
      id: job.id!,
      name: job.name,
      status: JobStatus.PENDING,
      createdAt: new Date().toISOString(),
    };
  }

  async getJobStatus(jobId: string) {
    const job = await this.sampleQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const state = await job.getState();
    const status = this.mapState(state);

    return {
      id: job.id!,
      name: job.name,
      status,
      progress: typeof job.progress === 'number' ? job.progress : undefined,
      result: job.returnvalue,
      failedReason: job.failedReason,
      createdAt: new Date(job.timestamp).toISOString(),
      finishedAt: job.finishedOn
        ? new Date(job.finishedOn).toISOString()
        : undefined,
    };
  }

  private mapState(state: string): JobStatus {
    switch (state) {
      case 'completed':
        return JobStatus.COMPLETED;
      case 'failed':
        return JobStatus.FAILED;
      case 'active':
        return JobStatus.ACTIVE;
      default:
        return JobStatus.PENDING;
    }
  }
}
