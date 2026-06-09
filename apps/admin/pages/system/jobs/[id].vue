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
  max-width: 860px;
}

.page-header {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.back-link {
  font-size: 0.875rem;
  color: var(--purple-400);
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.detail-card {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
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
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.detail-value {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.detail-value--mono {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  word-break: break-all;
}

.detail-value--error {
  color: var(--danger-400);
  font-family: var(--font-mono);
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
  background: var(--hover-overlay-strong);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.badge--processing {
  background: rgba(109, 40, 217, 0.12);
  color: var(--purple-300);
  border: 1px solid rgba(109, 40, 217, 0.25);
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

.badge--retrying {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-400);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.payload-pre {
  background: var(--hover-overlay);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  padding: 0.875rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.retry-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--surface-elevated);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
}

.retry-confirm-msg {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.retry-actions {
  display: flex;
  gap: 0.5rem;
}

.retry-btn {
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all var(--motion-fast);
}

.retry-btn:not(.retry-btn--confirm):not(.retry-btn--cancel) {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-400);
  border-color: rgba(245, 158, 11, 0.25);
}

.retry-btn:not(.retry-btn--confirm):not(.retry-btn--cancel):hover {
  background: rgba(245, 158, 11, 0.18);
}

.retry-btn--confirm {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger-400);
  border-color: rgba(239, 68, 68, 0.3);
}

.retry-btn--confirm:hover {
  background: rgba(239, 68, 68, 0.25);
}

.retry-btn--cancel {
  background: var(--hover-overlay);
  color: var(--text-secondary);
  border-color: var(--border-default);
}

.retry-btn--cancel:hover {
  background: var(--hover-overlay-strong);
}

.retry-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.retry-success {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--success-400);
}

.retry-error {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--danger-400);
}
</style>
