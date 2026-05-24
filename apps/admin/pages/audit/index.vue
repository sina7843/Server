<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">لاگ‌های حسابرسی</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(AUDIT_PERMISSION)" />

    <template v-else>
      <div class="filters">
        <select v-model="filters.actorType" class="filter-select" @change="onFilterChange">
          <option value="">همه انواع actor</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="system">system</option>
          <option value="job">job</option>
        </select>

        <select v-model="filters.severity" class="filter-select" @change="onFilterChange">
          <option value="">همه سطوح</option>
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="critical">critical</option>
        </select>

        <input
          v-model="filters.action"
          class="filter-input"
          type="text"
          placeholder="action (مثال: auth.login_success)"
          @change="onFilterChange"
        />

        <input
          v-model="filters.resourceType"
          class="filter-input"
          type="text"
          placeholder="resourceType"
          @change="onFilterChange"
        />

        <input
          v-model="filters.resourceId"
          class="filter-input"
          type="text"
          placeholder="resourceId"
          @change="onFilterChange"
        />

        <input
          v-model="filters.requestId"
          class="filter-input"
          type="text"
          placeholder="requestId"
          @change="onFilterChange"
        />

        <input
          v-model="filters.correlationId"
          class="filter-input"
          type="text"
          placeholder="correlationId"
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

      <LoadingState v-if="logsLoading" />
      <ErrorState v-else-if="logsError" :message="logsError" @retry="reload" />
      <EmptyState v-else-if="logs.length === 0" label="هیچ لاگی یافت نشد." />

      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="th">تاریخ</th>
                <th class="th">سطح</th>
                <th class="th">action</th>
                <th class="th">actorType</th>
                <th class="th">actorId</th>
                <th class="th">resourceType</th>
                <th class="th">resourceId</th>
                <th class="th" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id" class="tr">
                <td class="td td--mono">{{ formatDate(log.createdAt) }}</td>
                <td class="td">
                  <span :class="['badge', `badge--${log.severity}`]">{{ log.severity }}</span>
                </td>
                <td class="td td--mono">{{ log.action }}</td>
                <td class="td">{{ log.actorType }}</td>
                <td class="td td--mono td--truncate">{{ log.actorId ?? '—' }}</td>
                <td class="td">{{ log.resourceType }}</td>
                <td class="td td--mono td--truncate">{{ log.resourceId ?? '—' }}</td>
                <td class="td">
                  <NuxtLink :to="`/audit/${log.id}`" class="detail-link">جزئیات</NuxtLink>
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
            :disabled="logs.length < PAGE_LIMIT"
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
import type { AdminAuditListParams } from '@dragon/sdk';

const AUDIT_PERMISSION = DragonPermissions.AUDIT_LOG_READ;
const PAGE_LIMIT = 20;

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: DragonPermissions.AUDIT_LOG_READ,
});
useHead({ title: 'لاگ‌های حسابرسی — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const { logs, logsLoading, logsError, loadAuditLogs } = useAuditLogs();

const currentPage = ref(1);

const filters = reactive({
  actorType: '',
  severity: '',
  action: '',
  resourceType: '',
  resourceId: '',
  requestId: '',
  correlationId: '',
  dateFrom: '',
  dateTo: '',
});

function buildParams(page = currentPage.value): AdminAuditListParams {
  return {
    ...(filters.actorType
      ? { actorType: filters.actorType as 'user' | 'admin' | 'system' | 'job' }
      : {}),
    ...(filters.severity ? { severity: filters.severity as 'info' | 'warning' | 'critical' } : {}),
    ...(filters.action.trim() ? { action: filters.action.trim() } : {}),
    ...(filters.resourceType.trim() ? { resourceType: filters.resourceType.trim() } : {}),
    ...(filters.resourceId.trim() ? { resourceId: filters.resourceId.trim() } : {}),
    ...(filters.requestId.trim() ? { requestId: filters.requestId.trim() } : {}),
    ...(filters.correlationId.trim() ? { correlationId: filters.correlationId.trim() } : {}),
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
    page,
    limit: PAGE_LIMIT,
  };
}

async function reload(page = currentPage.value) {
  await loadAuditLogs(buildParams(page));
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
  filters.actorType = '';
  filters.severity = '';
  filters.action = '';
  filters.resourceType = '';
  filters.resourceId = '';
  filters.requestId = '';
  filters.correlationId = '';
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
  max-width: 12rem;
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

.badge--info {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.badge--warning {
  background-color: #fffbeb;
  color: #b45309;
}

.badge--critical {
  background-color: #fef2f2;
  color: #b91c1c;
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
