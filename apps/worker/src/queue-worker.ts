import { Worker } from 'bullmq';
import type { JobStatusUpdater } from './processors/processor-types';
import { processSmsJob } from './processors/sms-processor';
import { processMediaJob } from './processors/media-processor';
import { processMaintenanceJob } from './processors/maintenance-processor';

export interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface QueueWorkerOptions {
  connection: RedisConnectionConfig;
  prefix?: string;
  statusUpdater: JobStatusUpdater;
}

let activeWorkers: Worker[] = [];

export function startQueueWorkers(options: QueueWorkerOptions): Worker[] {
  const { connection, prefix = 'dragon', statusUpdater } = options;

  const smsWorker = new Worker('sms', (job) => processSmsJob(job, statusUpdater), {
    connection,
    prefix,
  });

  const mediaWorker = new Worker('media', (job) => processMediaJob(job, statusUpdater), {
    connection,
    prefix,
  });

  const maintenanceWorker = new Worker(
    'maintenance',
    (job) => processMaintenanceJob(job, statusUpdater),
    { connection, prefix },
  );

  for (const worker of [smsWorker, mediaWorker, maintenanceWorker]) {
    worker.on('error', (err) => {
      console.error(`[Worker:${worker.name}] Error:`, err.message);
    });
  }

  activeWorkers = [smsWorker, mediaWorker, maintenanceWorker];

  console.log(`[QueueWorker] Started ${activeWorkers.length} queue workers`);

  return activeWorkers;
}

export async function stopQueueWorkers(): Promise<void> {
  await Promise.all(activeWorkers.map((w) => w.close()));
  activeWorkers = [];
  console.log('[QueueWorker] All workers stopped');
}

export function getRedisConfigFromEnv(): RedisConnectionConfig {
  return {
    host: process.env['REDIS_HOST'] ?? 'localhost',
    port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
    ...(process.env['REDIS_PASSWORD'] ? { password: process.env['REDIS_PASSWORD'] } : {}),
    db: parseInt(process.env['REDIS_DB'] ?? '0', 10),
  };
}
