import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsNotEmpty, IsString } from 'class-validator';

class EnqueueSampleDto {
  @IsString()
  @IsNotEmpty()
  message!: string;
}

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post('sample')
  enqueue(@Req() req: Request, @Body() dto: EnqueueSampleDto) {
    return this.jobsService.enqueueSample({
      message: dto.message,
      userId: (req.user as { id: string }).id,
    });
  }

  @Get(':jobId')
  status(@Param('jobId') jobId: string) {
    return this.jobsService.getJobStatus(jobId);
  }
}
