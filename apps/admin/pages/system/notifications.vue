<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">اعلان‌ها</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(NOTIFICATION_PERMISSION)" />

    <template v-else>
      <div class="filters">
        <select v-model="filters.channel" class="filter-select" @change="onFilterChange">
          <option value="">همه کانال‌ها</option>
          <option value="sms">sms</option>
          <option value="email">email</option>
        </select>

        <select v-model="filters.status" class="filter-select" @change="onFilterChange">
          <option value="">همه وضعیت‌ها</option>
          <option value="queued">queued</option>
          <option value="sent">sent</option>
          <option value="failed">failed</option>
          <option value="skipped">skipped</option>
        </select>

        <input
          v-model="filters.provider"
          class="filter-input"
          type="text"
          placeholder="provider"
          @change="onFilterChange"
        />

        <input
          v-model="filters.templateKey"
          class="filter-input"
          type="text"
          placeholder="templateKey"
          @change="onFilterChange"
        />

        <input
          v-model="filters.purpose"
          class="filter-input"
          type="text"
          placeholder="purpose"
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
      <EmptyState v-else-if="logs.length === 0" label="هیچ اعلانی یافت نشد." />

      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="th">تاریخ</th>
                <th class="th">کانال</th>
                <th class="th">provider</th>
                <th class="th">گیرنده (masked)</th>
                <th class="th">purpose</th>
                <th class="th">وضعیت</th>
                <th class="th" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id" class="tr">
                <td class="td td--mono">{{ formatDate(log.createdAt) }}</td>
                <td class="td">{{ log.channel }}</td>
                <td class="td td--mono">{{ log.provider }}</td>
                <td class="td td--mono">{{ log.recipientMasked }}</td>
                <td class="td">{{ log.purpose ?? '—' }}</td>
                <td class="td">
                  <span :class="['badge', `badge--${log.status}`]">{{ log.status }}</span>
                </td>
                <td class="td">
                  <NuxtLink :to="`/system/notifications/${log.id}`" class="detail-link">
                    جزئیات
                  </NuxtLink>
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
import type {
  AdminNotificationsListParams,
  NotificationChannel,
  NotificationStatus,
} from '@dragon/sdk';

const NOTIFICATION_PERMISSION = DragonPermissions.NOTIFICATION_LOG_READ;
const PAGE_LIMIT = 20;

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: DragonPermissions.NOTIFICATION_LOG_READ,
});
useHead({ title: 'اعلان‌ها — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const { logs, logsLoading, logsError, loadNotificationLogs } = useNotificationLogs();

const currentPage = ref(1);

const filters = reactive({
  channel: '',
  status: '',
  provider: '',
  templateKey: '',
  purpose: '',
  dateFrom: '',
  dateTo: '',
});

function buildParams(page = currentPage.value): AdminNotificationsListParams {
  return {
    ...(filters.channel ? { channel: filters.channel as NotificationChannel } : {}),
    ...(filters.status ? { status: filters.status as NotificationStatus } : {}),
    ...(filters.provider.trim() ? { provider: filters.provider.trim() } : {}),
    ...(filters.templateKey.trim() ? { templateKey: filters.templateKey.trim() } : {}),
    ...(filters.purpose.trim() ? { purpose: filters.purpose.trim() } : {}),
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
    page,
    limit: PAGE_LIMIT,
  };
}

async function reload(page = currentPage.value) {
  await loadNotificationLogs(buildParams(page));
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
  filters.channel = '';
  filters.status = '';
  filters.provider = '';
  filters.templateKey = '';
  filters.purpose = '';
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

.badge--sent {
  background-color: #f0fdf4;
  color: #15803d;
}

.badge--failed {
  background-color: #fef2f2;
  color: #b91c1c;
}

.badge--skipped {
  background-color: #f5f3ff;
  color: #7c3aed;
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
