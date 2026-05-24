import { ref } from 'vue';
import type { AdminJobsListParams, JobLogDto, JobLogListItemDto } from '@dragon/sdk';
import * as jobsApi from '~/features/jobs/admin-jobs.api';

const _jobs = ref<readonly JobLogListItemDto[]>([]);
const _jobsTotal = ref(0);
const _jobsPage = ref(1);
const _jobsLoading = ref(false);
const _jobsError = ref<string | null>(null);

const _job = ref<JobLogDto | null>(null);
const _jobLoading = ref(false);
const _jobError = ref<string | null>(null);

const _retrying = ref(false);
const _retryError = ref<string | null>(null);
const _retrySuccess = ref(false);

export function useSystemJobs() {
  async function loadJobs(params?: AdminJobsListParams) {
    _jobsLoading.value = true;
    _jobsError.value = null;

    try {
      const res = await jobsApi.listJobs(useAdminApiClient(), params);
      _jobs.value = res.items;
      _jobsTotal.value = res.total;
      _jobsPage.value = res.page;
    } catch (err) {
      _jobsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری لاگ‌های جاب.';
    } finally {
      _jobsLoading.value = false;
    }
  }

  async function loadJob(id: string) {
    _job.value = null;
    _jobLoading.value = true;
    _jobError.value = null;

    try {
      const res = await jobsApi.getJob(useAdminApiClient(), id);
      _job.value = res;
    } catch (err) {
      _jobError.value = err instanceof Error ? err.message : 'خطا در بارگذاری جزئیات جاب.';
    } finally {
      _jobLoading.value = false;
    }
  }

  async function retryJob(id: string) {
    _retrying.value = true;
    _retryError.value = null;
    _retrySuccess.value = false;

    try {
      await jobsApi.retryJob(useAdminApiClient(), id);
      _retrySuccess.value = true;
    } catch (err) {
      _retryError.value = err instanceof Error ? err.message : 'خطا در تلاش مجدد جاب.';
    } finally {
      _retrying.value = false;
    }
  }

  return {
    jobs: _jobs,
    jobsTotal: _jobsTotal,
    jobsPage: _jobsPage,
    jobsLoading: _jobsLoading,
    jobsError: _jobsError,

    job: _job,
    jobLoading: _jobLoading,
    jobError: _jobError,

    retrying: _retrying,
    retryError: _retryError,
    retrySuccess: _retrySuccess,

    loadJobs,
    loadJob,
    retryJob,
  };
}
