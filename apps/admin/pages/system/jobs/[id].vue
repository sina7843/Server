<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/system/jobs" class="back-link">← جاب‌ها</NuxtLink>
      <h1 class="page-title">جزئیات جاب</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(JOB_PERMISSION)" />

    <template v-else>
      <LoadingState v-if="jobLoading" />
      <ErrorState v-else-if="jobError" :message="jobError" @retry="reload" />

      <template v-else-if="job">
        <div class="detail-card">
          <dl class="detail-grid">
            <div class="detail-row">
              <dt class="detail-key">ID</dt>
              <dd class="detail-value detail-value--mono">{{ job.id }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">queueName</dt>
              <dd class="detail-value detail-value--mono">{{ job.queueName }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">jobName</dt>
              <dd class="detail-value detail-value--mono">{{ job.jobName }}</dd>
            </div>
            <div v-if="job.bullJobId" class="detail-row">
              <dt class="detail-key">bullJobId</dt>
              <dd class="detail-value detail-value--mono">{{ job.bullJobId }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">status</dt>
              <dd class="detail-value">
                <span :class="['badge', `badge--${job.status}`]">{{ job.status }}</span>
              </dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">attempts</dt>
              <dd class="detail-value">{{ job.attempts }} / {{ job.maxAttempts }}</dd>
            </div>
            <div v-if="job.startedAt" class="detail-row">
              <dt class="detail-key">startedAt</dt>
              <dd class="detail-value">{{ formatDate(job.startedAt) }}</dd>
            </div>
            <div v-if="job.completedAt" class="detail-row">
              <dt class="detail-key">completedAt</dt>
              <dd class="detail-value">{{ formatDate(job.completedAt) }}</dd>
            </div>
            <div class="detail-row">
              <dt class="detail-key">createdAt</dt>
              <dd class="detail-value">{{ formatDate(job.createdAt) }}</dd>
            </div>
            <div v-if="job.error" class="detail-row">
              <dt class="detail-key">error</dt>
              <dd class="detail-value detail-value--error">{{ job.error }}</dd>
            </div>
          </dl>
        </div>

        <div v-if="job.payloadSummary" class="section">
          <h2 class="section-title">payloadSummary (redacted)</h2>
          <pre class="payload-pre">{{ safePayloadText }}</pre>
        </div>

        <div v-if="canRetry" class="retry-section">
          <template v-if="!retryConfirming">
            <button class="retry-btn" type="button" @click="retryConfirming = true">
              تلاش مجدد
            </button>
          </template>
          <template v-else>
            <p class="retry-confirm-msg">آیا مطمئن هستید؟ این جاب دوباره اجرا خواهد شد.</p>
            <div class="retry-actions">
              <button
                class="retry-btn retry-btn--confirm"
                type="button"
                :disabled="retrying"
                @click="onRetry"
              >
                {{ retrying ? 'در حال ارسال...' : 'بله، تلاش مجدد' }}
              </button>
              <button
                class="retry-btn retry-btn--cancel"
                type="button"
                :disabled="retrying"
                @click="retryConfirming = false"
              >
                انصراف
              </button>
            </div>
          </template>
          <p v-if="retrySuccess" class="retry-success">جاب با موفقیت مجدداً ارسال شد.</p>
          <p v-if="retryError" class="retry-error">{{ retryError }}</p>
        </div>
      </template>

      <EmptyState v-else label="جاب یافت نشد." />
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions } from '@dragon/sdk';

const JOB_PERMISSION = DragonPermissions.SYSTEM_JOB_READ;

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: DragonPermissions.SYSTEM_JOB_READ,
});

const route = useRoute();
const jobId = computed(() => String(route.params.id));

useHead({ title: 'جزئیات جاب — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const { job, jobLoading, jobError, loadJob, retrying, retryError, retrySuccess, retryJob } =
  useSystemJobs();

const retryConfirming = ref(false);

const canRetry = computed(
  () =>
    job.value !== null &&
    job.value.status === 'failed' &&
    job.value.attempts < job.value.maxAttempts &&
    hasPermission(DragonPermissions.SYSTEM_JOB_RETRY),
);

const safePayloadText = computed(() => {
  if (!job.value?.payloadSummary) return '';
  return JSON.stringify(job.value.payloadSummary, null, 2);
});

async function reload() {
  await loadJob(jobId.value);
}

async function onRetry() {
  await retryJob(jobId.value);
  if (retrySuccess.value) {
    retryConfirming.value = false;
    await reload();
  }
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
  font-family: monospace;
  font-size: 0.8125rem;
  word-break: break-all;
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

.badge--processing {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.badge--completed {
  background-color: #f0fdf4;
  color: #15803d;
}

.badge--failed {
  background-color: #fef2f2;
  color: #b91c1c;
}

.badge--retrying {
  background-color: #fffbeb;
  color: #b45309;
}

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.payload-pre {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.875rem;
  font-family: monospace;
  font-size: 0.8125rem;
  color: #374151;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.retry-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 0.5rem;
}

.retry-confirm-msg {
  font-size: 0.875rem;
  color: #92400e;
  margin-bottom: 0.75rem;
}

.retry-actions {
  display: flex;
  gap: 0.5rem;
}

.retry-btn {
  padding: 0.375rem 0.875rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  border: 1px solid transparent;
}

.retry-btn:not(.retry-btn--confirm):not(.retry-btn--cancel) {
  background-color: #ea580c;
  color: #ffffff;
  border-color: #ea580c;
}

.retry-btn--confirm {
  background-color: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
}

.retry-btn--cancel {
  background-color: #ffffff;
  color: #374151;
  border-color: #d1d5db;
}

.retry-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.retry-success {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #15803d;
}

.retry-error {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #b91c1c;
}
</style>
