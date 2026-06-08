<template>
  <div class="page">
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">مدیریت سیستم</h1>
        <p class="admin-page-subtitle">نظارت بر سلامت، جاب‌ها و اعلان‌های سیستم</p>
      </div>
    </div>

    <div class="hub-grid">
      <NuxtLink
        v-if="hasPermission(Permissions.SYSTEM_HEALTH_READ)"
        to="/system/health"
        class="hub-card hub-card--health"
      >
        <span class="hub-card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </span>
        <div class="hub-card-body">
          <span class="hub-card-title">سلامت سیستم</span>
          <span class="hub-card-desc">وضعیت سرویس‌ها و uptime</span>
        </div>
        <svg class="hub-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </NuxtLink>

      <NuxtLink
        v-if="hasPermission(Permissions.SYSTEM_JOB_READ)"
        to="/system/jobs"
        class="hub-card hub-card--jobs"
      >
        <span class="hub-card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93l-1.41 1.41" />
            <path d="M6.34 17.66l-1.41 1.41" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
          </svg>
        </span>
        <div class="hub-card-body">
          <span class="hub-card-title">جاب‌ها</span>
          <span class="hub-card-desc">صف‌های پردازش پس‌زمینه</span>
        </div>
        <svg class="hub-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </NuxtLink>

      <NuxtLink
        v-if="hasPermission(Permissions.NOTIFICATION_LOG_READ)"
        to="/system/notifications"
        class="hub-card hub-card--notifications"
      >
        <span class="hub-card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </span>
        <div class="hub-card-body">
          <span class="hub-card-title">اعلان‌ها</span>
          <span class="hub-card-desc">لاگ ارسال‌های اعلان سیستم</span>
        </div>
        <svg class="hub-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </NuxtLink>

      <NuxtLink
        v-if="hasPermission(Permissions.SYSTEM_BACKUP_READ)"
        to="/system/backups"
        class="hub-card hub-card--backups"
      >
        <span class="hub-card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </span>
        <div class="hub-card-body">
          <span class="hub-card-title">پشتیبان‌گیری</span>
          <span class="hub-card-desc">لاگ پشتیبان‌گیری از داده‌ها</span>
        </div>
        <svg class="hub-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.SYSTEM_HEALTH_READ,
});
useHead({ title: 'سیستم — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
</script>

<style scoped>
.page {
  max-width: 640px;
}

.hub-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hub-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--surface-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  text-decoration: none;
  transition:
    background var(--motion-fast),
    border-color var(--motion-fast),
    transform var(--motion-fast) var(--ease-spring);
}

.hub-card:hover {
  transform: translateX(-2px);
  background: var(--surface-elevated);
}

.hub-card:active {
  transform: scale(0.99);
}

.hub-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.hub-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hub-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.hub-card-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.hub-card-arrow {
  color: var(--text-disabled);
  flex-shrink: 0;
  transition: color var(--motion-fast);
}

.hub-card:hover .hub-card-arrow {
  color: var(--text-muted);
}

/* ── Icon accent colors ── */
.hub-card--health .hub-card-icon { background: rgba(16, 185, 129, 0.12); color: var(--success-400); }
.hub-card--health:hover { border-color: rgba(16, 185, 129, 0.3); }

.hub-card--jobs .hub-card-icon { background: rgba(109, 40, 217, 0.12); color: var(--purple-300); }
.hub-card--jobs:hover { border-color: rgba(109, 40, 217, 0.3); }

.hub-card--notifications .hub-card-icon { background: rgba(245, 158, 11, 0.12); color: var(--warning-400); }
.hub-card--notifications:hover { border-color: rgba(245, 158, 11, 0.3); }

.hub-card--backups .hub-card-icon { background: rgba(6, 182, 212, 0.12); color: var(--cyan-400); }
.hub-card--backups:hover { border-color: rgba(6, 182, 212, 0.3); }
</style>
