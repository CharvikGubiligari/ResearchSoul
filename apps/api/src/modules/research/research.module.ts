import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ResearchService } from './research.service';
import { ResearchController } from './research.controller';
import { ResearchProcessor } from './research.processor';
import { RESEARCH_QUEUE } from './research.constants';
import { BillingModule } from '../billing/billing.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: RESEARCH_QUEUE }),
    BillingModule,
    StorageModule,
  ],
  controllers: [ResearchController],
  providers: [ResearchService, ResearchProcessor],
  exports: [ResearchService],
})
export class ResearchModule {}
