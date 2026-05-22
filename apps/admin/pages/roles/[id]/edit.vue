<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink :to="`/roles/${roleId}`" class="back-link">← جزئیات نقش</NuxtLink>
      <h1 class="page-title">ویرایش نقش</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.RBAC_ROLE_UPDATE)" />

    <LoadingState v-else-if="roleLoading" />

    <ErrorState v-else-if="roleError" :message="roleError" @retry="reload" />

    <template v-else-if="role">
      <div v-if="role.isSystem" class="system-notice">
        <strong>نقش سیستمی:</strong> این نقش قابل ویرایش نیست.
      </div>

      <template v-else>
        <div class="card">
          <div class="card-row">
            <span class="label">کلید (key)</span>
            <code class="value-mono">{{ role.key }}</code>
            <span class="immutable-note">— غیرقابل تغییر</span>
          </div>
        </div>

        <form class="form" @submit.prevent="onSubmit">
          <div class="field">
            <label for="name-input" class="field-label">نام نمایشی</label>
            <input
              id="name-input"
              v-model="form.name"
              class="field-input"
              type="text"
              maxlength="128"
              required
            />
          </div>

          <div class="field">
            <label for="desc-input" class="field-label">
              توضیحات
              <span class="field-hint">(اختیاری)</span>
            </label>
            <textarea
              id="desc-input"
              v-model="form.description"
              class="field-textarea"
              rows="2"
              maxlength="500"
            />
          </div>

          <div class="field field-inline">
            <label class="toggle-label">
              <input v-model="form.isAssignable" type="checkbox" class="toggle-input" />
              <span>قابل تخصیص به کاربران</span>
            </label>
          </div>

          <div class="field field-inline">
            <label class="toggle-label">
              <input v-model="form.isActive" type="checkbox" class="toggle-input" />
              <span>فعال</span>
            </label>
            <span v-if="!form.isActive" class="deactivate-warning">
              غیرفعال‌سازی نقش دسترسی کاربران را تغییر می‌دهد.
            </span>
          </div>

          <div v-if="actionError" class="form-error" role="alert">{{ actionError }}</div>

          <div class="form-actions">
            <NuxtLink :to="`/roles/${roleId}`" class="cancel-btn">انصراف</NuxtLink>
            <button
              class="submit-btn"
              type="submit"
              :disabled="actionLoading || (!form.isActive && !showDeactivateConfirm)"
              @click.prevent="onSubmitClick"
            >
              <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
              ذخیره تغییرات
            </button>
          </div>
        </form>
      </template>
    </template>

    <ConfirmDialog
      :open="showDeactivateConfirm"
      title="تأیید غیرفعال‌سازی"
      description="با ذخیره این تغییر، نقش غیرفعال می‌شود و کاربران دارای آن دسترسی خود را از دست می‌دهند."
      confirm-label="تأیید و ذخیره"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onConfirmedSave"
      @cancel="showDeactivateConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.RBAC_ROLE_UPDATE,
});
useHead({ title: 'ویرایش نقش — Dragon Admin' });

const route = useRoute();
const router = useRouter();
const roleId = route.params.id as string;

const { hasPermission } = useAdminPermissions();
const { role, roleLoading, roleError, actionLoading, actionError, loadRole, updateRole } =
  useAdminRoles();

const showDeactivateConfirm = ref(false);

const form = reactive({
  name: '',
  description: '',
  isAssignable: true,
  isActive: true,
});

async function reload() {
  await loadRole(roleId);
  if (role.value) {
    form.name = role.value.name;
    form.description = role.value.description ?? '';
    form.isAssignable = role.value.isAssignable;
    form.isActive = role.value.isActive;
  }
}

function onSubmitClick() {
  if (!form.isActive && role.value?.isActive) {
    showDeactivateConfirm.value = true;
    return;
  }
  onSubmit();
}

async function onSubmit() {
  showDeactivateConfirm.value = false;

  const ok = await updateRole(roleId, {
    name: form.name.trim(),
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
    isAssignable: form.isAssignable,
    isActive: form.isActive,
  });

  if (ok) {
    await router.push(`/roles/${roleId}`);
  }
}

async function onConfirmedSave() {
  await onSubmit();
}

onMounted(reload);
</script>

<style scoped>
.page {
  max-width: 540px;
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

.system-notice {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #1e40af;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
  margin-block-end: 1.25rem;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
}

.label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  min-width: 90px;
}

.value-mono {
  font-family: monospace;
  font-size: 0.85rem;
  background: #f1f5f9;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
}

.immutable-note {
  font-size: 0.78rem;
  color: #94a3b8;
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
  font-size: 0.8rem;
}

.field-input,
.field-textarea {
  padding: 0.5rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}

.field-input:focus,
.field-textarea:focus {
  border-color: #3b82f6;
}

.field-textarea {
  resize: vertical;
}

.field-inline {
  flex-direction: column;
  gap: 0.25rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
}

.toggle-input {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.deactivate-warning {
  font-size: 0.8rem;
  color: #b45309;
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
