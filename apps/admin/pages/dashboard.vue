<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">داشبورد</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.ADMIN_DASHBOARD_VIEW)" />

    <LoadingState v-else-if="summaryLoading" />

    <ErrorState v-else-if="summaryError" :message="summaryError" @retry="loadSummary" />

    <template v-else-if="summary">
      <div v-if="summary.users" class="stat-grid">
        <div class="stat-card dr-card">
          <div
            class="stat-icon-wrap"
            style="background: rgba(124, 58, 237, 0.15); color: var(--purple-400)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div class="stat-label">کل کاربران</div>
            <div class="stat-value">{{ summary.users.total }}</div>
          </div>
        </div>

        <div v-if="summary.users.active !== undefined" class="stat-card dr-card">
          <div
            class="stat-icon-wrap"
            style="background: rgba(16, 185, 129, 0.15); color: var(--success-400)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div class="stat-label">کاربران فعال</div>
            <div class="stat-value stat-value--green">{{ summary.users.active }}</div>
          </div>
        </div>

        <div v-if="summary.users.pending !== undefined" class="stat-card dr-card">
          <div
            class="stat-icon-wrap"
            style="background: rgba(251, 191, 36, 0.15); color: var(--warning-400)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div class="stat-label">در انتظار تأیید</div>
            <div class="stat-value stat-value--amber">{{ summary.users.pending }}</div>
          </div>
        </div>
      </div>

      <div v-if="summary.system" class="system-card dr-card">
        <span class="system-label">وضعیت سیستم</span>
        <span
          class="status-badge"
          :class="{
            'badge-ok': summary.system.status === 'ok',
            'badge-degraded': summary.system.status === 'degraded',
            'badge-unavailable': summary.system.status === 'unavailable',
          }"
        >
          {{ statusLabel(summary.system.status) }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.ADMIN_DASHBOARD_VIEW,
});
useHead({ title: 'داشبورد — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const { summary, summaryLoading, summaryError, loadSummary } = useAdminDashboard();

function statusLabel(status: 'ok' | 'degraded' | 'unavailable'): string {
  if (status === 'ok') return 'سالم';
  if (status === 'degraded') return 'کاهش‌یافته';
  return 'در دسترس نیست';
}

onMounted(() => {
  if (hasPermission(Permissions.ADMIN_DASHBOARD_VIEW)) {
    loadSummary();
  }
});
</script>

<style scoped>
.page {
  max-width: 860px;
}

.page-header {
  margin-bottom: 28px;
}

.page-title {
  margin: 0;
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h2-tracking);
  color: var(--text-primary);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
}

.stat-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 28px;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--text-primary);
}
.stat-value--green {
  color: var(--success-400);
}
.stat-value--amber {
  color: var(--warning-400);
}

.system-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.system-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.badge-ok {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success-400);
}
.badge-degraded {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning-400);
}
.badge-unavailable {
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger-400);
}
</style>
