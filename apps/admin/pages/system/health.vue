<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/system" class="back-link">← سیستم</NuxtLink>
      <h1 class="page-title">سلامت سیستم</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.SYSTEM_HEALTH_READ)" />

    <LoadingState v-else-if="healthLoading" />

    <ErrorState v-else-if="healthError" :message="healthError" @retry="loadHealth" />

    <div v-else-if="health" class="card">
      <div class="card-row">
        <span class="label">وضعیت</span>
        <span class="value">
          <span
            :class="{
              'badge-ok': health.status === 'ok',
              'badge-degraded': health.status === 'degraded',
              'badge-unavailable': health.status === 'unavailable',
            }"
          >
            {{ statusLabel(health.status) }}
          </span>
        </span>
      </div>
      <div class="card-row">
        <span class="label">سرویس</span>
        <code class="value value-mono">{{ health.service }}</code>
      </div>
      <div v-if="health.version" class="card-row">
        <span class="label">نسخه</span>
        <code class="value value-mono">{{ health.version }}</code>
      </div>
      <div class="card-row">
        <span class="label">بررسی‌شده در</span>
        <span class="value value-time">{{ formatCheckedAt(health.checkedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: 'system.health.read',
});
useHead({ title: 'سلامت سیستم — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const { health, healthLoading, healthError, loadHealth } = useAdminSystem();

function statusLabel(status: 'ok' | 'degraded' | 'unavailable'): string {
  if (status === 'ok') return 'سالم';
  if (status === 'degraded') return 'کاهش‌یافته';
  return 'در دسترس نیست';
}

function formatCheckedAt(iso: string): string {
  return new Date(iso).toLocaleString('fa-IR');
}

onMounted(() => {
  if (hasPermission(Permissions.SYSTEM_HEALTH_READ)) {
    loadHealth();
  }
});
</script>

<style scoped>
.page {
  max-width: 600px;
}

.page-header {
  margin-block-end: 1.25rem;
}

.back-link {
  font-size: 0.85rem;
  color: #3b82f6;
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
  color: #1e293b;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  border-block-end: 1px solid #f1f5f9;
}

.card-row:last-child {
  border-block-end: none;
}

.label {
  min-width: 110px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
}

.value {
  font-size: 0.9rem;
  color: #1e293b;
}

.value-mono {
  font-family: monospace;
  font-size: 0.85rem;
  background: #f1f5f9;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
}

.value-time {
  font-size: 0.85rem;
  color: #475569;
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
