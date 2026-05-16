export type WorkerRuntimeStatus = 'ready';

export interface WorkerRuntimeOptions {
  readonly name: string;
}

export interface WorkerRuntimeState {
  readonly name: string;
  readonly status: WorkerRuntimeStatus;
}

export function createWorkerRuntime(options: WorkerRuntimeOptions): WorkerRuntimeState {
  return {
    name: options.name,
    status: 'ready',
  };
}
