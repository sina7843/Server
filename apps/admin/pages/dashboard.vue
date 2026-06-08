<template>
  <div class="page">
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">داشبورد</h1>
        <p class="admin-page-subtitle">خلاصه وضعیت سیستم Dragon</p>
      </div>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.ADMIN_DASHBOARD_VIEW)" />
    <LoadingState v-else-if="summaryLoading" />
    <ErrorState v-else-if="summaryError" :message="summaryError" @retry="loadSummary" />

    <template v-else-if="summary">
      <!-- System health banner -->
      <div
        v-if="summary.system"
        class="health-banner"
        :class="`health-banner--${summary.system.status}`"
      >
        <span class="health-dot" />
        <span class="health-text">وضعیت سیستم: {{ statusLabel(summary.system.status) }}</span>
        <NuxtLink to="/system/health" class="health-link">جزئیات</NuxtLink>
      </div>

      <!-- User stats -->
      <div v-if="summary.users" class="admin-stat-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-head">
            <span class="admin-stat-icon admin-stat-icon--purple">
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
            </span>
          </div>
          <div class="admin-stat-num">{{ summary.users.total }}</div>
          <div class="admin-stat-label">کل کاربران</div>
        </div>

        <div v-if="summary.users.active !== undefined" class="admin-stat-card">
          <div class="admin-stat-head">
            <span class="admin-stat-icon admin-stat-icon--success">
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
            </span>
          </div>
          <div class="admin-stat-num" style="color: var(--success-400)">
            {{ summary.users.active }}
          </div>
          <div class="admin-stat-label">کاربران فعال</div>
        </div>

        <div v-if="summary.users.pending !== undefined" class="admin-stat-card">
          <div class="admin-stat-head">
            <span class="admin-stat-icon admin-stat-icon--warning">
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
            </span>
          </div>
          <div class="admin-stat-num" style="color: var(--warning-400)">
            {{ summary.users.pending }}
          </div>
          <div class="admin-stat-label">در انتظار تأیید</div>
        </div>
      </div>

      <!-- Quick navigation -->
      <div class="quick-nav">
        <NuxtLink to="/tournaments/new" class="qn-card qn-card--purple">
          <span class="qn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </span>
          <span class="qn-label">تورنمنت جدید</span>
        </NuxtLink>
        <NuxtLink to="/users" class="qn-card qn-card--cyan">
          <span class="qn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </span>
          <span class="qn-label">کاربران</span>
        </NuxtLink>
        <NuxtLink to="/analytics" class="qn-card qn-card--success">
          <span class="qn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          <span class="qn-label">آنالیتیکس</span>
        </NuxtLink>
        <NuxtLink to="/audit" class="qn-card qn-card--warning">
          <span class="qn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </span>
          <span class="qn-label">لاگ حسابرسی</span>
        </NuxtLink>
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
  max-width: 900px;
}

/* ── Health banner ── */
.health-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  margin-block-end: 20px;
  font-size: 13px;
  font-weight: 500;
}

.health-banner--ok {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: var(--success-400);
}

.health-banner--degraded {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: var(--warning-400);
}

.health-banner--unavailable {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--danger-400);
}

.health-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: currentColor;
}

.health-banner--ok .health-dot {
  box-shadow: 0 0 6px currentColor;
  animation: dr-pulse 2s infinite;
}

.health-banner--unavailable .health-dot {
  animation: dr-pulse 1.5s infinite;
}

.health-text {
  flex: 1;
}

.health-link {
  font-size: 12px;
  color: inherit;
  opacity: 0.7;
  text-decoration: none;
  border-bottom: 1px solid currentColor;
  transition: opacity var(--motion-fast);
}

.health-link:hover {
  opacity: 1;
}

/* ── Quick nav ── */
.quick-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-block-start: 20px;
}

@media (max-width: 768px) {
  .quick-nav {
    grid-template-columns: repeat(2, 1fr);
  }
}

.qn-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 16px;
  border-radius: var(--radius-md);
  text-decoration: none;
  border: 1px solid transparent;
  transition:
    background var(--motion-fast),
    border-color var(--motion-fast),
    transform var(--motion-fast) var(--ease-spring);
}

.qn-card:hover {
  transform: translateY(-1px);
}

.qn-card:active {
  transform: translateY(0) scale(0.98);
}

.qn-card--purple {
  background: rgba(109, 40, 217, 0.08);
  border-color: rgba(109, 40, 217, 0.2);
  color: var(--purple-300);
}

.qn-card--purple:hover {
  background: rgba(109, 40, 217, 0.14);
  border-color: rgba(109, 40, 217, 0.35);
}

.qn-card--cyan {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.2);
  color: var(--cyan-400);
}

.qn-card--cyan:hover {
  background: rgba(6, 182, 212, 0.14);
  border-color: rgba(6, 182, 212, 0.35);
}

.qn-card--success {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
  color: var(--success-400);
}

.qn-card--success:hover {
  background: rgba(16, 185, 129, 0.14);
  border-color: rgba(16, 185, 129, 0.35);
}

.qn-card--warning {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.2);
  color: var(--warning-400);
}

.qn-card--warning:hover {
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.35);
}

.qn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.06);
}

.qn-label {
  font-size: 13px;
  font-weight: 600;
}
</style>
