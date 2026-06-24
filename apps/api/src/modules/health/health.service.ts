import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { StorageService } from '../storage/storage.service';
import type { HealthStatus } from '@researchsoul/shared';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private storage: StorageService,
  ) {}

  async check(): Promise<HealthStatus> {
    const [database, redis, storage] = await Promise.all([
      this.checkDatabase(),
      this.redis.ping(),
      this.storage.checkHealth(),
    ]);

    const services = {
      database: database ? ('up' as const) : ('down' as const),
      redis: redis ? ('up' as const) : ('down' as const),
      storage: storage ? ('up' as const) : ('down' as const),
    };

    const allUp = Object.values(services).every((s) => s === 'up');

    return {
      status: allUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
    };
  }

  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
