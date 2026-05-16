import { createWorkerRuntime } from './runtime';

const runtime = createWorkerRuntime({
  name: 'dragon-worker',
});

console.log(`Worker runtime started: ${runtime.name} (${runtime.status})`);

const shutdown = (): void => {
  console.log('Worker runtime shutdown requested');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
