<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">جاب‌ها</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(JOB_PERMISSION)" />

    <template v-else>
      <div class="filters">
        <select v-model="filters.queueName" class="filter-select" @change="onFilterChange">
          <option value="">همه صف‌ها</option>
          <option value="sms">sms</option>
          <option value="media">media</option>
          <option value="maintenance">maintenance</option>
        </select>

        <select v-model="filters.status" class="filter-select" @change="onFilterChange">
          <option value="">همه وضعیت‌ها</option>
          <option value="queued">queued</option>
          <option value="processing">processing</option>
          <option value="completed">completed</option>
          <option value="failed">failed</option>
          <option value="retrying">retrying</option>
        </select>

        <input
          v-model="filters.jobName"
          class="filter-input"
          type="text"
          placeholder="jobName (مثال: sms.send)"
          @change="onFilterChange"
        />

        <input
          v-model="filters.dateFrom"
          class="filter-input"
          type="date"
          placeholder="از تاریخ"
          @change="onFilterChange"
        />

        <input
          v-model="filters.dateTo"
          class="filter-input"
          type="date"
          placeholder="تا تاریخ"
          @change="onFilterChange"
        />

        <button class="filter-reset-btn" type="button" @click="resetFilters">
          پاک‌کردن فیلترها
        </button>
      </div>

      <LoadingState v-if="jobsLoading" />
      <ErrorState v-else-if="jobsError" :message="jobsError" @retry="reload" />
      <EmptyState v-else-if="jobs.length === 0" label="هیچ جابی یافت نشد." />

      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="th">تاریخ</th>
                <th class="th">صف</th>
                <th class="th">نام جاب</th>
                <th class="th">وضعیت</th>
                <th class="th">تلاش‌ها</th>
                <th class="th">خطا</th>
                <th class="th" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="job in jobs" :key="job.id" class="tr">
                <td class="td td--mono">{{ formatDate(job.createdAt) }}</td>
                <td class="td td--mono">{{ job.queueName }}</td>
                <td class="td td--mono">{{ job.jobName }}</td>
                <td class="td">
                  <span :class="['badge', `badge--${job.status}`]">{{ job.status }}</span>
                </td>
                <td class="td">{{ job.attempts }} / {{ job.maxAttempts }}</td>
                <td class="td td--truncate">{{ job.error ?? '—' }}</td>
                <td class="td">
                  <NuxtLink :to="`/system/jobs/${job.id}`" class="detail-link">جزئیات</NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button
            class="page-btn"
            type="button"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            قبلی
          </button>
          <span class="page-info">صفحه {{ currentPage }}</span>
          <button
            class="page-btn"
            type="button"
            :disabled="jobs.length < PAGE_LIMIT"
            @click="goToPage(currentPage + 1)"
          >
            بعدی
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions } from '@dragon/sdk';
import type { AdminJobsListParams, JobStatus } from '@dragon/sdk';

const JOB_PERMISSION = DragonPermissions.SYSTEM_JOB_READ;
const PAGE_LIMIT = 20;

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: DragonPermissions.SYSTEM_JOB_READ,
});
useHead({ title: 'جاب‌ها — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const { jobs, jobsLoading, jobsError, loadJobs } = useSystemJobs();

const currentPage = ref(1);

const filters = reactive({
  queueName: '',
  status: '',
  jobName: '',
  dateFrom: '',
  dateTo: '',
});

function buildParams(page = currentPage.value): AdminJobsListParams {
  return {
    ...(filters.queueName ? { queueName: filters.queueName } : {}),
    ...(filters.status ? { status: filters.status as JobStatus } : {}),
    ...(filters.jobName.trim() ? { jobName: filters.jobName.trim() } : {}),
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
    page,
    limit: PAGE_LIMIT,
  };
}

async function reload(page = currentPage.value) {
  await loadJobs(buildParams(page));
}

async function onFilterChange() {
  currentPage.value = 1;
  await reload(1);
}

async function goToPage(page: number) {
  currentPage.value = page;
  await reload(page);
}

function resetFilters() {
  filters.queueName = '';
  filters.status = '';
  filters.jobName = '';
  filters.dateFrom = '';
  filters.dateTo = '';
  currentPage.value = 1;
  reload(1);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

onMounted(reload);
</script>

<style scoped>
.page {
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.filter-select,
.filter-input {
  padding: 0.375rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: #ffffff;
  color: #111827;
  min-width: 10rem;
}

.filter-reset-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: #f3f4f6;
  color: #374151;
  cursor: pointer;
}

.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.th {
  padding: 0.625rem 0.75rem;
  text-align: right;
  font-weight: 600;
  color: #6b7280;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.tr:hover {
  background-color: #f9fafb;
}

.td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.td--mono {
  font-family: monospace;
  font-size: 0.8125rem;
}

.td--truncate {
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge--queued {
  background-color: #f3f4f6;
  color: #374151;
}

.badge--processing {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.badge--completed {
  background-color: #f0fdf4;
  color: #15803d;
}

.badge--failed {
  background-color: #fef2f2;
  color: #b91c1c;
}

.badge--retrying {
  background-color: #fffbeb;
  color: #b45309;
}

.detail-link {
  color: #4f46e5;
  text-decoration: none;
  font-size: 0.8125rem;
}

.detail-link:hover {
  text-decoration: underline;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.25rem;
  justify-content: center;
}

.page-btn {
  padding: 0.375rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #ffffff;
  cursor: pointer;
  font-size: 0.875rem;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
}
</style>
