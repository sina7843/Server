<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/system" class="back-link">← سیستم</NuxtLink>
      <h1 class="page-title">سلامت سیستم</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.SYSTEM_HEALTH_READ)" />

    <template v-else>
      <LoadingState v-if="healthLoading && dependenciesLoading" />

      <ErrorState
        v-else-if="healthError && dependenciesError"
        :message="healthError"
        @retry="reload"
      />

      <template v-else>
        <div v-if="health" class="card section">
          <h2 class="section-title">وضعیت کلی</h2>
          <div class="card-row">
            <span class="label">وضعیت</span>
            <span class="value">
              <span :class="statusBadgeClass(health.status)">
                {{ overallStatusLabel(health.status) }}
              </span>
            </span>
          </div>
          <div class="card-row">
            <span class="label">سرویس</span>
            <code class="value value-mono">{{ health.service }}</code>
          </div>
          <div class="card-row">
            <span class="label">بررسی‌شده در</span>
            <span class="value value-time">{{ formatTime(health.checkedAt) }}</span>
          </div>
        </div>

        <div v-if="dependencies" class="card section">
          <h2 class="section-title">وضعیت سرویس‌ها</h2>

          <div class="dep-grid">
            <div class="dep-panel">
              <div class="dep-name">MongoDB</div>
              <div :class="depBadgeClass(dependencies.dependencies.mongodb.status)">
                {{ depLabel(dependencies.dependencies.mongodb.status) }}
              </div>
              <div
                v-if="dependencies.dependencies.mongodb.latencyMs !== undefined"
                class="dep-latency"
              >
                {{ dependencies.dependencies.mongodb.latencyMs }} ms
              </div>
            </div>

            <div class="dep-panel">
              <div class="dep-name">Redis</div>
              <div :class="depBadgeClass(dependencies.dependencies.redis.status)">
                {{ depLabel(dependencies.dependencies.redis.status) }}
              </div>
              <div
                v-if="dependencies.dependencies.redis.latencyMs !== undefined"
                class="dep-latency"
              >
                {{ dependencies.dependencies.redis.latencyMs }} ms
              </div>
            </div>

            <div class="dep-panel">
              <div class="dep-name">Object Storage</div>
              <div :class="depBadgeClass(dependencies.dependencies.storage.status)">
                {{ depLabel(dependencies.dependencies.storage.status) }}
              </div>
            </div>

            <div class="dep-panel">
              <div class="dep-name">SMS</div>
              <div :class="depBadgeClass(dependencies.dependencies.sms.status)">
                {{ depLabel(dependencies.dependencies.sms.status) }}
              </div>
            </div>
          </div>
        </div>

        <ErrorState
          v-if="dependenciesError && !dependencies"
          :message="dependenciesError"
          @retry="loadDependencies"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';
import type { HealthStatus } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.SYSTEM_HEALTH_READ,
});
useHead({ title: 'سلامت سیستم — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const { health, healthLoading, healthError, loadHealth } = useAdminSystem();
const { dependencies, dependenciesLoading, dependenciesError, loadDependencies } =
  useSystemHealth();

function overallStatusLabel(status: 'ok' | 'degraded' | 'unavailable'): string {
  if (status === 'ok') return 'سالم';
  if (status === 'degraded') return 'کاهش‌یافته';
  return 'در دسترس نیست';
}

function depLabel(status: HealthStatus): string {
  if (status === 'ok') return 'سالم';
  if (status === 'degraded') return 'کاهش‌یافته';
  if (status === 'down') return 'قطع';
  return 'نامشخص';
}

function statusBadgeClass(status: 'ok' | 'degraded' | 'unavailable'): string {
  if (status === 'ok') return 'badge-ok';
  if (status === 'degraded') return 'badge-degraded';
  return 'badge-unavailable';
}

function depBadgeClass(status: HealthStatus): string {
  if (status === 'ok') return 'dep-badge dep-badge--ok';
  if (status === 'degraded') return 'dep-badge dep-badge--degraded';
  if (status === 'down') return 'dep-badge dep-badge--down';
  return 'dep-badge dep-badge--unknown';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('fa-IR');
}

async function reload() {
  await Promise.all([loadHealth(), loadDependencies()]);
}

onMounted(() => {
  if (hasPermission(Permissions.SYSTEM_HEALTH_READ)) {
    void loadHealth();
    void loadDependencies();
  }
});
</script>

<style scoped>
.page {
  max-width: 700px;
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

.section {
  margin-block-end: 1.25rem;
}

.section-title {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #475569;
  padding: 0.75rem 1.25rem 0;
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

.dep-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
  padding: 0.75rem 1.25rem 1rem;
}

.dep-panel {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.dep-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.dep-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  width: fit-content;
}

.dep-badge--ok {
  background: #dcfce7;
  color: #166534;
}

.dep-badge--degraded {
  background: #fef9c3;
  color: #854d0e;
}

.dep-badge--down {
  background: #fee2e2;
  color: #991b1b;
}

.dep-badge--unknown {
  background: #f1f5f9;
  color: #64748b;
}

.dep-latency {
  font-size: 0.75rem;
  color: #94a3b8;
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
