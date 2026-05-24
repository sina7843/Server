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

export interface NotificationLogStatusUpdateInput {
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export type NotificationLogStatusUpdater = (
  notificationLogId: string,
  status: 'sent' | 'failed',
  updates?: NotificationLogStatusUpdateInput,
) => Promise<void>;
