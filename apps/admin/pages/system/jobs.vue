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
  max-width: 1100px;
}

.page-header {
  margin-block-end: 1.5rem;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-block-end: 1.25rem;
}

.filter-select,
.filter-input {
  height: 34px;
  padding: 0 0.625rem;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-family: inherit;
  min-width: 10rem;
  outline: none;
  transition: border-color var(--motion-fast);
}

.filter-select:focus,
.filter-input:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
}

.filter-input::placeholder {
  color: var(--text-muted);
}

.filter-reset-btn {
  height: 34px;
  padding: 0 0.75rem;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  background: var(--hover-overlay);
  color: var(--text-secondary);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--motion-fast);
}

.filter-reset-btn:hover {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.th {
  padding: 10px 12px;
  text-align: start;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--hover-overlay);
  border-block-end: 1px solid var(--border-default);
  white-space: nowrap;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tr:hover {
  background: var(--hover-overlay);
}

.td {
  padding: 0.625rem 0.75rem;
  border-block-end: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.td--mono {
  font-family: var(--font-mono);
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
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge--queued {
  background: var(--hover-overlay-strong);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.badge--processing {
  background: rgba(109, 40, 217, 0.12);
  color: var(--purple-300);
  border: 1px solid rgba(109, 40, 217, 0.25);
}

.badge--completed {
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-400);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.badge--failed {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-400);
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.badge--retrying {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-400);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.detail-link {
  color: var(--purple-400);
  text-decoration: none;
  font-size: 0.8125rem;
}

.detail-link:hover {
  text-decoration: underline;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-block-start: 16px;
  justify-content: flex-end;
}

.page-btn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--motion-fast);
}

.page-btn:not(:disabled):hover {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-muted);
}
</style>
