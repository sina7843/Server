<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/system" class="back-link">← سیستم</NuxtLink>
      <div class="page-header-row">
        <h1 class="page-title">پشتیبان‌گیری</h1>
        <button
          v-if="hasPermission(Permissions.SYSTEM_BACKUP_RUN) && !showConfirm"
          class="run-btn"
          :disabled="running"
          type="button"
          @click="showConfirm = true"
        >
          {{ running ? 'در حال اجرا...' : 'اجرای پشتیبان‌گیری' }}
        </button>
      </div>

      <div v-if="showConfirm" class="confirm-box">
        <span class="confirm-text">آیا مطمئن هستید؟ پشتیبان‌گیری MongoDB اجرا خواهد شد.</span>
        <div class="confirm-actions">
          <button class="confirm-btn confirm-btn--yes" :disabled="running" @click="onRunConfirm">
            بله، اجرا کن
          </button>
          <button class="confirm-btn confirm-btn--no" @click="showConfirm = false">انصراف</button>
        </div>
      </div>

      <div v-if="runSuccess" class="alert alert--success">
        پشتیبان‌گیری آغاز شد. وضعیت را در لیست زیر دنبال کنید.
      </div>
      <div v-if="runError" class="alert alert--error">{{ runError }}</div>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.SYSTEM_BACKUP_READ)" />

    <template v-else>
      <div class="section">
        <h2 class="section-title">آخرین پشتیبان</h2>
        <LoadingState v-if="latestLoading" />
        <ErrorState v-else-if="latestError" :message="latestError" @retry="loadLatestBackup" />
        <div v-else-if="latest" class="card">
          <div class="card-row">
            <span class="label">وضعیت</span>
            <span :class="['badge', `badge--${latest.status}`]">
              {{ statusLabel(latest.status) }}
            </span>
          </div>
          <div class="card-row">
            <span class="label">نوع</span>
            <span class="value value-mono">{{ latest.type }}</span>
          </div>
          <div class="card-row">
            <span class="label">راه‌انداز</span>
            <span class="value">{{ triggeredByLabel(latest.triggeredBy) }}</span>
          </div>
          <div class="card-row">
            <span class="label">شروع</span>
            <span class="value value-time">{{ formatTime(latest.startedAt) }}</span>
          </div>
          <div v-if="latest.completedAt" class="card-row">
            <span class="label">پایان</span>
            <span class="value value-time">{{ formatTime(latest.completedAt) }}</span>
          </div>
          <div v-if="latest.sizeBytes !== undefined" class="card-row">
            <span class="label">حجم</span>
            <span class="value">{{ formatBytes(latest.sizeBytes) }}</span>
          </div>
          <div v-if="latest.status === 'failed' && latest.error" class="card-row">
            <span class="label">خطا</span>
            <span class="value value-error">{{ latest.error }}</span>
          </div>
        </div>
        <EmptyState v-else label="هیچ پشتیبان موفقی یافت نشد." />
      </div>

      <div class="section">
        <h2 class="section-title">تاریخچه پشتیبان‌ها</h2>

        <div class="filters">
          <select v-model="filters.status" class="filter-select" @change="onFilterChange">
            <option value="">همه وضعیت‌ها</option>
            <option value="started">started</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
          </select>

          <select v-model="filters.type" class="filter-select" @change="onFilterChange">
            <option value="">همه انواع</option>
            <option value="mongodb">mongodb</option>
            <option value="media_metadata">media_metadata</option>
            <option value="manual">manual</option>
          </select>

          <button class="filter-reset-btn" type="button" @click="resetFilters">
            پاک‌کردن فیلترها
          </button>
        </div>

        <LoadingState v-if="backupsLoading" />
        <ErrorState v-else-if="backupsError" :message="backupsError" @retry="reload" />
        <EmptyState v-else-if="backups.length === 0" label="هیچ پشتیبانی یافت نشد." />

        <template v-else>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th class="th">شروع</th>
                  <th class="th">نوع</th>
                  <th class="th">وضعیت</th>
                  <th class="th">راه‌انداز</th>
                  <th class="th">حجم</th>
                  <th class="th">خطا</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="backup in backups" :key="backup.id" class="tr">
                  <td class="td td--mono">{{ formatTime(backup.startedAt) }}</td>
                  <td class="td td--mono">{{ backup.type }}</td>
                  <td class="td">
                    <span :class="['badge', `badge--${backup.status}`]">
                      {{ statusLabel(backup.status) }}
                    </span>
                  </td>
                  <td class="td">{{ triggeredByLabel(backup.triggeredBy) }}</td>
                  <td class="td">
                    {{ backup.sizeBytes !== undefined ? formatBytes(backup.sizeBytes) : '—' }}
                  </td>
                  <td class="td td--error">{{ backup.error ?? '' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <button
              class="page-btn"
              :disabled="currentPage <= 1"
              @click="goToPage(currentPage - 1)"
            >
              ‹ قبلی
            </button>
            <span class="page-info">صفحه {{ currentPage }}</span>
            <button
              class="page-btn"
              :disabled="currentPage * PAGE_LIMIT >= total"
              @click="goToPage(currentPage + 1)"
            >
              بعدی ›
            </button>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { DragonPermissions as Permissions } from '@dragon/sdk';
import type { BackupStatus, BackupTriggeredBy, BackupType } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.SYSTEM_BACKUP_READ,
});
useHead({ title: 'پشتیبان‌گیری — Dragon Admin' });

const PAGE_LIMIT = 20;

const { hasPermission } = useAdminPermissions();
const {
  backups,
  backupsLoading,
  backupsError,
  total,
  loadBackups,
  latest,
  latestLoading,
  latestError,
  loadLatestBackup,
  running,
  runSuccess,
  runError,
  triggerBackup,
} = useBackups();

const currentPage = ref(1);
const showConfirm = ref(false);
const filters = ref<{ status: BackupStatus | ''; type: BackupType | '' }>({
  status: '',
  type: '',
});

function statusLabel(status: BackupStatus): string {
  if (status === 'completed') return 'موفق';
  if (status === 'failed') return 'ناموفق';
  return 'در حال اجرا';
}

function triggeredByLabel(by: BackupTriggeredBy): string {
  if (by === 'admin') return 'ادمین';
  if (by === 'manual_script') return 'اسکریپت';
  return 'سیستم';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('fa-IR');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function buildParams(page: number) {
  return {
    page,
    limit: PAGE_LIMIT,
    ...(filters.value.status ? { status: filters.value.status } : {}),
    ...(filters.value.type ? { type: filters.value.type } : {}),
  };
}

async function reload(page = currentPage.value) {
  currentPage.value = page;
  await loadBackups(buildParams(page));
}

function onFilterChange() {
  void reload(1);
}

function resetFilters() {
  filters.value = { status: '', type: '' };
  void reload(1);
}

function goToPage(page: number) {
  void reload(page);
}

async function onRunConfirm() {
  showConfirm.value = false;
  await triggerBackup();
  if (runSuccess.value) {
    await Promise.all([loadLatestBackup(), reload(1)]);
  }
}

onMounted(() => {
  if (hasPermission(Permissions.SYSTEM_BACKUP_READ)) {
    void loadLatestBackup();
    void reload(1);
  }
});
</script>

<style scoped>
.page {
  max-width: 900px;
}

.page-header {
  margin-block-end: 1.5rem;
}

.page-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.back-link {
  font-size: 0.85rem;
  color: var(--purple-400);
  text-decoration: none;
  display: inline-block;
  margin-block-end: 0.4rem;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.run-btn {
  height: 36px;
  padding: 0 16px;
  background: var(--purple-500);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 6px 20px -6px rgba(109, 40, 217, 0.5);
  transition: all var(--motion-fast);
}

.run-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.run-btn:hover:not(:disabled) {
  background: var(--purple-400);
}

.confirm-box {
  margin-block-start: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--surface-elevated);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.confirm-text {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.confirm-actions {
  display: flex;
  gap: 0.5rem;
}

.confirm-btn {
  height: 32px;
  padding: 0 14px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--motion-fast);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-btn--yes {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger-400);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.confirm-btn--yes:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
}

.confirm-btn--no {
  background: var(--hover-overlay);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.confirm-btn--no:hover {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
}

.alert {
  margin-block-start: 0.75rem;
  padding: 0.6rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 500;
}

.alert--success {
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-400);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.alert--error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-400);
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.section {
  margin-block-end: 1.5rem;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0 0 0.75rem;
}

.card {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.card-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.65rem 1.25rem;
  border-block-end: 1px solid var(--border-subtle);
}

.card-row:last-child {
  border-block-end: none;
}

.label {
  min-width: 80px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
}

.value {
  font-size: 0.88rem;
  color: var(--text-primary);
}

.value-mono {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  background: var(--hover-overlay);
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-xs);
  color: var(--text-primary);
}

.value-time {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.value-error {
  font-size: 0.82rem;
  color: var(--danger-400);
  word-break: break-all;
}

.filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-block-end: 0.75rem;
}

.filter-select {
  height: 32px;
  padding: 0 0.6rem;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  background: var(--input-bg);
  color: var(--text-secondary);
  font-family: inherit;
  outline: none;
  cursor: pointer;
  transition: border-color var(--motion-fast);
}

.filter-select:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
}

.filter-reset-btn {
  height: 32px;
  padding: 0 0.75rem;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--motion-fast);
}

.filter-reset-btn:hover {
  background: var(--hover-overlay);
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
  font-size: 0.82rem;
}

.th {
  text-align: start;
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--hover-overlay);
  border-block-end: 1px solid var(--border-default);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tr {
  border-block-end: 1px solid var(--border-subtle);
}

.tr:last-child {
  border-block-end: none;
}

.td {
  padding: 0.6rem 1rem;
  color: var(--text-secondary);
  vertical-align: top;
}

.td--mono {
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.td--error {
  color: var(--danger-400);
  max-width: 200px;
  word-break: break-all;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
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

.badge--started {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-400);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-block-start: 0.75rem;
  font-size: 0.85rem;
}

.page-btn {
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--text-secondary);
  font-family: inherit;
  transition: all var(--motion-fast);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:hover:not(:disabled) {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.page-info {
  color: var(--text-muted);
}
</style>
