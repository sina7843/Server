export interface JobStatusUpdateInput {
  attempts?: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export type JobStatusUpdater = (
  jobLogId: string,
  status: 'processing' | 'completed' | 'failed' | 'retrying',
  updates?: JobStatusUpdateInput,
) => Promise<void>;
