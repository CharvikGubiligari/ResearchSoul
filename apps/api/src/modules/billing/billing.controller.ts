import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

@Controller('organizations/:orgId/billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(
    private billingService: BillingService,
    private prisma: PrismaService,
  ) {}

  @Get('credits')
  async credits(@Req() req: Request, @Param('orgId') orgId: string) {
    await this.assertMember((req.user as { id: string }).id, orgId);
    const credits = await this.billingService.getCredits(orgId);
    return { organizationId: orgId, credits };
  }

  @Get('usage')
  async usage(@Req() req: Request, @Param('orgId') orgId: string) {
    await this.assertMember((req.user as { id: string }).id, orgId);
    const events = await this.billingService.listUsageEvents(orgId);
    return { organizationId: orgId, events };
  }

  private async assertMember(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }
  }
}
