<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink :to="`/users/${userId}`" class="back-link">← جزئیات کاربر</NuxtLink>
      <h1 class="page-title">تغییر وضعیت کاربر</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.USER_STATUS_UPDATE)" />

    <LoadingState v-else-if="userLoading" />

    <ErrorState v-else-if="userError" :message="userError" @retry="reload" />

    <template v-else-if="user">
      <div class="card">
        <div class="user-summary">
          <span class="user-name">
            {{ user.profile?.displayName ?? user.profile?.username ?? user.id }}
          </span>
          <UserStatusBadge :status="user.status" />
        </div>
      </div>

      <form class="form" @submit.prevent="onSubmitRequest">
        <div class="field">
          <label for="status-select" class="field-label">وضعیت جدید</label>
          <select id="status-select" v-model="selectedStatus" class="field-select">
            <option v-for="s in ADMIN_USER_STATUS_UPDATE_TARGETS" :key="s" :value="s">
              {{ STATUS_LABELS[s] }}
            </option>
          </select>
        </div>

        <div v-if="isDestructive" class="field">
          <label for="reason-input" class="field-label">
            دلیل
            <span class="field-hint">{{ isDestructive ? '(الزامی)' : '(اختیاری)' }}</span>
          </label>
          <textarea
            id="reason-input"
            v-model="reason"
            class="field-textarea"
            rows="3"
            maxlength="500"
            placeholder="دلیل تغییر وضعیت…"
          />
        </div>

        <div v-if="actionError" class="form-error" role="alert">{{ actionError }}</div>

        <div class="form-actions">
          <NuxtLink :to="`/users/${userId}`" class="cancel-btn">انصراف</NuxtLink>
          <button
            class="submit-btn"
            :class="{ 'submit-btn--destructive': isDestructive }"
            type="submit"
            :disabled="actionLoading || (isDestructive && !reason.trim())"
          >
            <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
            اعمال تغییر
          </button>
        </div>
      </form>

      <ConfirmDialog
        :open="showConfirm"
        :title="`تغییر وضعیت به «${STATUS_LABELS[selectedStatus]}»`"
        :description="confirmDescription"
        :confirm-label="isDestructive ? 'تأیید — غیر قابل بازگشت' : 'تأیید'"
        :destructive="isDestructive"
        :loading="actionLoading"
        @confirm="onConfirm"
        @cancel="showConfirm = false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  DragonPermissions as Permissions,
  ADMIN_USER_STATUS_UPDATE_TARGETS,
} from '@dragon/sdk';
import type { AdminUserStatus, AdminUserStatusUpdateTarget } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.USER_STATUS_UPDATE,
});

const route = useRoute();
const router = useRouter();
const userId = route.params.id as string;

const { hasPermission } = useAdminPermissions();
const { user, userLoading, userError, actionLoading, actionError, loadUser, updateStatus } =
  useAdminUsers();

useHead({ title: 'تغییر وضعیت — Dragon Admin' });

const STATUS_LABELS: Record<AdminUserStatusUpdateTarget, string> = {
  active: 'فعال',
  suspended: 'تعلیق',
  banned: 'مسدود',
  deleted: 'حذف‌شده',
};

const DESTRUCTIVE_STATUSES: readonly AdminUserStatusUpdateTarget[] = ['suspended', 'banned', 'deleted'];

const selectedStatus = ref<AdminUserStatusUpdateTarget>('active');
const reason = ref('');
const showConfirm = ref(false);

const isDestructive = computed(() => DESTRUCTIVE_STATUSES.includes(selectedStatus.value));

const confirmDescription = computed(() => {
  if (selectedStatus.value === 'deleted')
    return 'این عملیات حساب کاربر را به حالت حذف‌شده درمی‌آورد. این عملیات غیر قابل بازگشت است.';
  if (selectedStatus.value === 'banned') return 'این عملیات کاربر را به‌صورت دائم مسدود می‌کند.';
  if (selectedStatus.value === 'suspended') return 'این عملیات کاربر را به‌صورت موقت تعلیق می‌کند.';
  return 'وضعیت کاربر تغییر خواهد کرد.';
});

async function reload() {
  await loadUser(userId);
  if (user.value) {
    const current = user.value.status as AdminUserStatus;
    selectedStatus.value = (ADMIN_USER_STATUS_UPDATE_TARGETS as readonly string[]).includes(current)
      ? (current as AdminUserStatusUpdateTarget)
      : 'active';
  }
}

function onSubmitRequest() {
  if (isDestructive.value && !reason.value.trim()) return;
  showConfirm.value = true;
}

async function onConfirm() {
  const ok = await updateStatus(userId, selectedStatus.value, reason.value.trim() || undefined);
  if (ok) {
    showConfirm.value = false;
    await router.push(`/users/${userId}`);
  }
}

onMounted(reload);
</script>

<style scoped>
.page {
  max-width: 560px;
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
  padding: 1rem 1.25rem;
  margin-block-end: 1.25rem;
}

.user-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-name {
  font-weight: 600;
  font-size: 1rem;
  color: #1e293b;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.field-hint {
  font-weight: 400;
  color: #9ca3af;
  margin-inline-start: 0.3rem;
}

.field-select,
.field-textarea {
  padding: 0.5rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}

.field-select:focus,
.field-textarea:focus {
  border-color: #3b82f6;
}

.field-textarea {
  resize: vertical;
}

.form-error {
  font-size: 0.85rem;
  color: #dc2626;
  background: #fee2e2;
  padding: 0.5rem 0.85rem;
  border-radius: 0.4rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: flex-end;
  margin-block-start: 0.25rem;
}

.cancel-btn {
  font-size: 0.9rem;
  color: #475569;
  text-decoration: none;
}

.cancel-btn:hover {
  text-decoration: underline;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.25rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.submit-btn:not(:disabled):hover {
  background: #2563eb;
}

.submit-btn--destructive {
  background: #ef4444;
}

.submit-btn--destructive:not(:disabled):hover {
  background: #dc2626;
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-spinner {
  width: 0.85rem;
  height: 0.85rem;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
