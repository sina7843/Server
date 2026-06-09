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
  max-width: 12rem;
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

.badge--info {
  background: rgba(109, 40, 217, 0.12);
  color: var(--purple-300);
  border: 1px solid rgba(109, 40, 217, 0.25);
}

.badge--warning {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-400);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.badge--critical {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-400);
  border: 1px solid rgba(239, 68, 68, 0.25);
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
