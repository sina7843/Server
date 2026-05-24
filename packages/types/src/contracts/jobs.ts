export const JOB_STATUSES = ['queued', 'processing', 'completed', 'failed', 'retrying'] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const QUEUE_NAMES = {
  SMS: 'sms',
  MEDIA: 'media',
  MAINTENANCE: 'maintenance',
} as const;

export type QueueNameValue = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const JOB_NAMES = {
  SMS_SEND: 'sms.send',
  MEDIA_GENERATE_VARIANTS: 'media.generate_variants',
  MEDIA_REGENERATE_VARIANTS: 'media.regenerate_variants',
  MAINTENANCE_CLEANUP_EXPIRED_SESSIONS: 'maintenance.cleanup_expired_sessions',
  MAINTENANCE_CLEANUP_EXPIRED_OTPS: 'maintenance.cleanup_expired_otps',
  MAINTENANCE_CLEANUP_UNVERIFIED_USERS: 'maintenance.cleanup_unverified_users',
} as const;

export type JobNameValue = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

export interface DomainEventDto {
  readonly eventId: string;
  readonly name: string;
  readonly occurredAt: string;
  readonly actorId?: string;
  readonly actorType?: 'user' | 'admin' | 'system' | 'job';
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly payload: object;
  readonly requestId?: string;
  readonly correlationId?: string;
}

export interface JobLogDto {
  readonly id: string;
  readonly queueName: string;
  readonly jobName: string;
  readonly bullJobId?: string;
  readonly status: JobStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly payloadSummary?: Record<string, unknown>;
  readonly error?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface JobLogListItemDto {
  readonly id: string;
  readonly queueName: string;
  readonly jobName: string;
  readonly status: JobStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly error?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly createdAt: string;
}

export interface JobLogListQueryDto {
  readonly queueName?: string;
  readonly jobName?: string;
  readonly status?: JobStatus;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface JobLogListResponseDto {
  readonly items: JobLogListItemDto[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export interface RetryJobResponseDto {
  readonly id: string;
  readonly status: JobStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
}
