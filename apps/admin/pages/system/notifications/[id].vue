<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/system/notifications" class="back-link">← اعلان‌ها</NuxtLink>
      <h1 class="page-title">جزئیات اعلان</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(NOTIFICATION_PERMISSION)" />

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
              <dt class="detail-key">channel</dt>
              <dd class="detail-value">{{ log.channel }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">provider</dt>
              <dd class="detail-value detail-value--mono">{{ log.provider }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">گیرنده (masked)</dt>
              <dd class="detail-value detail-value--mono">{{ log.recipientMasked }}</dd>
            </div>
            <div v-if="log.templateKey" class="detail-row">
              <dt class="detail-key">templateKey</dt>
              <dd class="detail-value detail-value--mono">{{ log.templateKey }}</dd>
            </div>
            <div v-if="log.purpose" class="detail-row">
              <dt class="detail-key">purpose</dt>
              <dd class="detail-value">{{ log.purpose }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">status</dt>
              <dd class="detail-value">
                <span :class="['badge', `badge--${log.status}`]">{{ log.status }}</span>
              </dd>
            </div>
            <div v-if="log.providerMessageId" class="detail-row">
              <dt class="detail-key">providerMessageId</dt>
              <dd class="detail-value detail-value--mono">{{ log.providerMessageId }}</dd>
            </div>
            <div v-if="log.errorCode" class="detail-row">
              <dt class="detail-key">errorCode</dt>
              <dd class="detail-value detail-value--mono detail-value--error">
                {{ log.errorCode }}
              </dd>
            </div>
            <div v-if="log.errorMessage" class="detail-row">
              <dt class="detail-key">errorMessage</dt>
              <dd class="detail-value detail-value--error">{{ log.errorMessage }}</dd>
            </div>
            <div v-if="log.requestId" class="detail-row">
              <dt class="detail-key">requestId</dt>
              <dd class="detail-value detail-value--mono">{{ log.requestId }}</dd>
            </div>
            <div v-if="log.correlationId" class="detail-row">
              <dt class="detail-key">correlationId</dt>
              <dd class="detail-value detail-value--mono">{{ log.correlationId }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">createdAt</dt>
              <dd class="detail-value">{{ formatDate(log.createdAt) }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">updatedAt</dt>
              <dd class="detail-value">{{ formatDate(log.updatedAt) }}</dd>
            </div>
          </dl>
        </div>
      </template>

      <EmptyState v-else label="اعلان یافت نشد." />
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions } from '@dragon/sdk';

const NOTIFICATION_PERMISSION = DragonPermissions.NOTIFICATION_LOG_READ;

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: DragonPermissions.NOTIFICATION_LOG_READ,
});

const route = useRoute();
const logId = computed(() => String(route.params.id));

useHead({ title: 'جزئیات اعلان — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const { log, logLoading, logError, loadNotificationLog } = useNotificationLogs();

async function reload() {
  await loadNotificationLog(logId.value);
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

.detail-value--error {
  color: #b91c1c;
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
</style>
