import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Connection } from 'mongoose';
import type { HealthStatus, HealthDependencyDto } from '@dragon/types';
import { QueueNames } from '../jobs/queue-registry';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectQueue(QueueNames.SMS) private readonly smsQueue: Queue,
  ) {}

  async checkMongoDB(): Promise<HealthDependencyDto> {
    const start = Date.now();
    try {
      const db = this.connection.db;
      if (!db) throw new Error('not connected');
      await db.command({ ping: 1 });
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch {
      return { status: 'down', latencyMs: Date.now() - start };
    }
  }

  async checkRedis(): Promise<HealthDependencyDto> {
    const start = Date.now();
    try {
      const client = await this.smsQueue.client;
      await (client as unknown as { ping(): Promise<string> }).ping();
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch {
      return { status: 'down', latencyMs: Date.now() - start };
    }
  }

  checkStorage(): { status: HealthStatus } {
    return { status: process.env['STORAGE_PROVIDER'] ? 'ok' : 'unknown' };
  }

  checkSms(): { status: HealthStatus } {
    return { status: process.env['SMS_PROVIDER'] ? 'ok' : 'unknown' };
  }

  async getReadiness(): Promise<{
    mongodb: HealthDependencyDto;
    redis: HealthDependencyDto;
  }> {
    const [mongodb, redis] = await Promise.all([this.checkMongoDB(), this.checkRedis()]);
    return { mongodb, redis };
  }

  async getDependencies(): Promise<{
    mongodb: HealthDependencyDto;
    redis: HealthDependencyDto;
    storage: { status: HealthStatus };
    sms: { status: HealthStatus };
  }> {
    const [mongodb, redis] = await Promise.all([this.checkMongoDB(), this.checkRedis()]);
    return { mongodb, redis, storage: this.checkStorage(), sms: this.checkSms() };
  }

  overallStatus(deps: Record<string, { status: HealthStatus }>): HealthStatus {
    const statuses = Object.values(deps).map((d) => d.status);
    if (statuses.some((s) => s === 'down')) return 'down';
    if (statuses.some((s) => s === 'degraded' || s === 'unknown')) return 'degraded';
    return 'ok';
  }
}
