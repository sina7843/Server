import type { ApiClient } from './client';
import type { AdminJobsClient, AdminJobsListParams } from './admin-jobs-types';
import type { JobLogDto, JobLogListResponseDto, RetryJobResponseDto } from '@dragon/types';

export function createAdminJobsClient(client: ApiClient): AdminJobsClient {
  return {
    listJobs(params?: AdminJobsListParams): Promise<JobLogListResponseDto> {
      const search = new URLSearchParams();
      if (params?.queueName) search.set('queueName', params.queueName);
      if (params?.jobName) search.set('jobName', params.jobName);
      if (params?.status) search.set('status', params.status);
      if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
      if (params?.dateTo) search.set('dateTo', params.dateTo);
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<JobLogListResponseDto>({
        method: 'GET',
        path: `/admin/v1/system/jobs${qs ? `?${qs}` : ''}`,
      });
    },

    getJob(id: string): Promise<JobLogDto> {
      return client.request<JobLogDto>({
        method: 'GET',
        path: `/admin/v1/system/jobs/${encodeURIComponent(id)}`,
      });
    },

    retryJob(id: string): Promise<RetryJobResponseDto> {
      return client.request<RetryJobResponseDto>({
        method: 'POST',
        path: `/admin/v1/system/jobs/${encodeURIComponent(id)}/retry`,
      });
    },
  };
}
