import type {
  JobLogDto,
  JobLogListResponseDto,
  JobStatus,
  RetryJobResponseDto,
} from '@dragon/types';

export type { JobLogDto, JobLogListResponseDto, RetryJobResponseDto };

export interface AdminJobsListParams {
  readonly queueName?: string;
  readonly jobName?: string;
  readonly status?: JobStatus;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminJobsClient {
  listJobs(params?: AdminJobsListParams): Promise<JobLogListResponseDto>;
  getJob(id: string): Promise<JobLogDto>;
  retryJob(id: string): Promise<RetryJobResponseDto>;
}
