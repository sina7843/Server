import { createAdminJobsClient } from '@dragon/sdk';
import type {
  AdminJobsListParams,
  JobLogDto,
  JobLogListResponseDto,
  RetryJobResponseDto,
} from '@dragon/sdk';
import type { ApiClient } from '@dragon/sdk';

export async function listJobs(
  client: ApiClient,
  params?: AdminJobsListParams,
): Promise<JobLogListResponseDto> {
  return createAdminJobsClient(client).listJobs(params);
}

export async function getJob(client: ApiClient, id: string): Promise<JobLogDto> {
  return createAdminJobsClient(client).getJob(id);
}

export async function retryJob(client: ApiClient, id: string): Promise<RetryJobResponseDto> {
  return createAdminJobsClient(client).retryJob(id);
}
