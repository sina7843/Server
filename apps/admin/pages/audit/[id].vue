<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/audit" class="back-link">← لاگ‌های حسابرسی</NuxtLink>
      <h1 class="page-title">جزئیات لاگ حسابرسی</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(AUDIT_PERMISSION)" />

    <template v-else>
      <LoadingState v-if="logLoading" />
      <ErrorState v-else-if="logError" :message="logError" @retry="reload" />

      <template v-else-if="log">
        <div class="detail-card">
          <dl class="detail-grid">
            <div class="detail-row">
              <dt class="detail-key">ID</dt>
              <dd class="detail-value detail-value--mono">{{ log.id }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">action</dt>
              <dd class="detail-value detail-value--mono">{{ log.action }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">severity</dt>
              <dd class="detail-value">
                <span :class="['badge', `badge--${log.severity}`]">{{ log.severity }}</span>
              </dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">actorType</dt>
              <dd class="detail-value">{{ log.actorType }}</dd>
            </div>
            <div v-if="log.actorId" class="detail-row">
              <dt class="detail-key">actorId</dt>
              <dd class="detail-value detail-value--mono">{{ log.actorId }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">resourceType</dt>
              <dd class="detail-value">{{ log.resourceType }}</dd>
            </div>
            <div v-if="log.resourceId" class="detail-row">
              <dt class="detail-key">resourceId</dt>
              <dd class="detail-value detail-value--mono">{{ log.resourceId }}</dd>
            </div>
            <div v-if="log.requestId" class="detail-row">
              <dt class="detail-key">requestId</dt>
              <dd class="detail-value detail-value--mono">{{ log.requestId }}</dd>
            </div>
            <div v-if="log.correlationId" class="detail-row">
              <dt class="detail-key">correlationId</dt>
              <dd class="detail-value detail-value--mono">{{ log.correlationId }}</dd>
            </div>
            <div v-if="log.ip" class="detail-row">
              <dt class="detail-key">IP</dt>
              <dd class="detail-value detail-value--mono">{{ log.ip }}</dd>
            </div>
            <div v-if="log.userAgent" class="detail-row">
              <dt class="detail-key">User-Agent</dt>
              <dd class="detail-value detail-value--truncate">{{ log.userAgent }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">createdAt</dt>
              <dd class="detail-value">{{ formatDate(log.createdAt) }}</dd>
            </div>
          </dl>
        </div>

        <div
          v-if="log.before !== undefined || log.after !== undefined || log.metadata !== undefined"
          class="diff-section"
        >
          <h2 class="section-title">تغییرات</h2>
          <AuditDiffViewer :before="log.before" :after="log.after" :metadata="log.metadata" />
        </div>
      </template>

      <EmptyState v-else label="لاگ حسابرسی یافت نشد." />
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions } from '@dragon/sdk';

const AUDIT_PERMISSION = DragonPermissions.AUDIT_LOG_READ;

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: DragonPermissions.AUDIT_LOG_READ,
});

const route = useRoute();
const logId = computed(() => String(route.params.id));

useHead({ title: `لاگ حسابرسی — Dragon Admin` });

const { hasPermission } = useAdminPermissions();
const { log, logLoading, logError, loadAuditLog } = useAuditLogs();

async function reload() {
  await loadAuditLog(logId.value);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'medium' });
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
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.back-link {
  font-size: 0.875rem;
  color: #6b7280;
  text-decoration: none;
}

.back-link:hover {
  color: #4f46e5;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.detail-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
}

.detail-row {
  display: grid;
  grid-template-columns: 10rem 1fr;
  gap: 0.5rem;
  align-items: start;
}

.detail-key {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  font-family: monospace;
}

.detail-value {
  font-size: 0.875rem;
  color: #111827;
}

.detail-value--mono {
  font-family: monospace;
  font-size: 0.8125rem;
  word-break: break-all;
}

.detail-value--truncate {
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

.diff-section {
  margin-top: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}
</style>
