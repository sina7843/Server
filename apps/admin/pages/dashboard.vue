<template>
  <div class="page">
    <h1 class="page-title">داشبورد</h1>

    <ForbiddenState v-if="!hasPermission(Permissions.ADMIN_DASHBOARD_VIEW)" />

    <LoadingState v-else-if="summaryLoading" />

    <ErrorState v-else-if="summaryError" :message="summaryError" @retry="loadSummary" />

    <template v-else-if="summary">
      <div v-if="summary.users" class="stat-grid">
        <div class="stat-card">
          <span class="stat-label">کل کاربران</span>
          <span class="stat-value">{{ summary.users.total }}</span>
        </div>
        <div v-if="summary.users.active !== undefined" class="stat-card">
          <span class="stat-label">کاربران فعال</span>
          <span class="stat-value stat-active">{{ summary.users.active }}</span>
        </div>
        <div v-if="summary.users.pending !== undefined" class="stat-card">
          <span class="stat-label">در انتظار تأیید</span>
          <span class="stat-value stat-pending">{{ summary.users.pending }}</span>
        </div>
      </div>

      <div v-if="summary.system" class="system-row">
        <span class="system-label">وضعیت سیستم</span>
        <span
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

.page-title {
  margin: 0 0 1.5rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-block-end: 1.5rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #fff;
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-active {
  color: #16a34a;
}

.stat-pending {
  color: #ca8a04;
}

.system-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #fff;
}

.system-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}

.badge-ok {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  background: #dcfce7;
  color: #166534;
}

.badge-degraded {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  background: #fef9c3;
  color: #854d0e;
}

.badge-unavailable {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  background: #fee2e2;
  color: #991b1b;
}
</style>
