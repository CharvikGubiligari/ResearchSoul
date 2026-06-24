import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor(private config: ConfigService) {
    this.client = new Redis(this.config.get<string>('REDIS_URL')!, {
      maxRetriesPerRequest: null,
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async setSession(sessionId: string, userId: string, ttlSeconds: number) {
    await this.client.setex(`session:${sessionId}`, ttlSeconds, userId);
  }

  async getSession(sessionId: string): Promise<string | null> {
    return this.client.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string) {
    await this.client.del(`session:${sessionId}`);
  }
}
