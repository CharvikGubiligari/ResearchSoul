import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { SAMPLE_QUEUE } from './jobs.constants';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { SampleProcessor } from './sample.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
        },
      }),
    }),
    BullModule.registerQueue({ name: SAMPLE_QUEUE }),
  ],
  controllers: [JobsController],
  providers: [JobsService, SampleProcessor],
  exports: [JobsService],
})
export class JobsModule {}
