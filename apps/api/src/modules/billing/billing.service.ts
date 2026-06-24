import { Injectable } from '@nestjs/common';
import { UsageEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async recordUsage(
    organizationId: string,
    type: UsageEventType,
    amount: number,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.usageEvent.create({
      data: {
        organizationId,
        type,
        amount,
        metadata: metadata ?? undefined,
      },
    });
  }

  async getCredits(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { credits: true },
    });
    return org ? Number(org.credits) : 0;
  }

  async listUsageEvents(organizationId: string, limit = 50) {
    return this.prisma.usageEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
