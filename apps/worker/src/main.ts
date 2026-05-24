import { createWorkerRuntime } from './runtime';
import {
  connectJobLogMongo,
  disconnectJobLogMongo,
  mongoJobStatusUpdater,
  createNoopStatusUpdater,
} from './job-log-updater';
import { startQueueWorkers, stopQueueWorkers, getRedisConfigFromEnv } from './queue-worker';

async function main(): Promise<void> {
  const runtime = createWorkerRuntime({ name: 'dragon-worker' });
  console.log(`Worker runtime started: ${runtime.name} (${runtime.status})`);

  const mongoUri = process.env['MONGODB_URI'];
  let statusUpdater = createNoopStatusUpdater();

  if (mongoUri) {
    try {
      await connectJobLogMongo(mongoUri);
      statusUpdater = mongoJobStatusUpdater;
      console.log('[Worker] Connected to MongoDB for JobLog updates');
    } catch (err) {
      console.error('[Worker] MongoDB connection failed, JobLog updates disabled:', err);
    }
  } else {
    console.warn('[Worker] MONGODB_URI not set, JobLog status updates are disabled');
  }

  const connection = getRedisConfigFromEnv();
  const prefix = process.env['BULLMQ_PREFIX'] ?? 'dragon';

  startQueueWorkers({ connection, prefix, statusUpdater });

  const shutdown = async (): Promise<void> => {
    console.log('[Worker] Shutdown requested');
    await stopQueueWorkers();
    await disconnectJobLogMongo();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[Worker] Fatal startup error:', err);
  process.exit(1);
});
