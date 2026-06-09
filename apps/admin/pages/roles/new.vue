<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/roles" class="back-link">← نقش‌ها</NuxtLink>
      <h1 class="page-title">ایجاد نقش جدید</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.RBAC_ROLE_CREATE)" />

    <template v-else>
      <form class="form" @submit.prevent="onSubmit">
        <div class="field">
          <label for="key-input" class="field-label">
            کلید (key)
            <span class="field-hint">فقط حروف کوچک، اعداد و زیرخط</span>
          </label>
          <input
            id="key-input"
            v-model="form.key"
            class="field-input"
            type="text"
            placeholder="مثال: content_editor"
            pattern="[a-z][a-z0-9_]*"
            maxlength="64"
            required
          />
          <span v-if="keyError" class="field-error">{{ keyError }}</span>
        </div>

        <div class="field">
          <label for="name-input" class="field-label">نام نمایشی</label>
          <input
            id="name-input"
            v-model="form.name"
            class="field-input"
            type="text"
            placeholder="مثال: ویراستار محتوا"
            maxlength="128"
            required
          />
          <span v-if="nameError" class="field-error">{{ nameError }}</span>
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
            placeholder="توضیح کوتاه درباره این نقش…"
          />
        </div>

        <div class="field field-inline">
          <label class="toggle-label">
            <input v-model="form.isAssignable" type="checkbox" class="toggle-input" />
            <span>قابل تخصیص به کاربران</span>
          </label>
        </div>

        <div v-if="actionError" class="form-error" role="alert">{{ actionError }}</div>

        <div class="form-actions">
          <NuxtLink to="/roles" class="cancel-btn">انصراف</NuxtLink>
          <button class="submit-btn" type="submit" :disabled="actionLoading">
            <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
            ایجاد نقش
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.RBAC_ROLE_CREATE,
});
useHead({ title: 'ایجاد نقش — Dragon Admin' });

const router = useRouter();
const { hasPermission } = useAdminPermissions();
const { actionLoading, actionError, createRole } = useAdminRoles();

const ROLE_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

const form = reactive({
  key: '',
  name: '',
  description: '',
  isAssignable: true,
});

const keyError = ref('');
const nameError = ref('');

function validate(): boolean {
  keyError.value = '';
  nameError.value = '';

  if (!ROLE_KEY_PATTERN.test(form.key)) {
    keyError.value = 'کلید باید با حرف کوچک شروع شود و فقط حروف، اعداد و زیرخط داشته باشد.';
    return false;
  }

  if (form.name.trim().length === 0) {
    nameError.value = 'نام الزامی است.';
    return false;
  }

  return true;
}

async function onSubmit() {
  if (!validate()) return;

  const result = await createRole({
    key: form.key,
    name: form.name.trim(),
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
    isAssignable: form.isAssignable,
  });

  if (result) {
    await router.push(`/roles/${result.id}`);
  }
}
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
  color: var(--purple-400);
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
  color: var(--text-primary);
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
  color: var(--text-secondary);
}

.field-hint {
  font-weight: 400;
  color: var(--text-muted);
  margin-inline-start: 0.3rem;
  font-size: 0.8rem;
}

.field-input,
.field-textarea {
  padding: 0.5rem 0.85rem;
  background: var(--input-bg);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--motion-fast);
  font-family: inherit;
}

.field-input:focus,
.field-textarea:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.15);
}

.field-textarea {
  resize: vertical;
}

.field-error {
  font-size: 0.8rem;
  color: var(--danger-400);
}

.field-inline {
  flex-direction: row;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.toggle-input {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.form-error {
  font-size: 0.85rem;
  color: var(--danger-400);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-xs);
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
  color: var(--text-muted);
  text-decoration: none;
}

.cancel-btn:hover {
  text-decoration: underline;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 36px;
  padding: 0 1.25rem;
  background: var(--purple-500);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 0 0 0 rgba(109, 40, 217, 0);
  transition: all var(--motion-fast);
}

.submit-btn:not(:disabled):hover {
  background: var(--purple-400);
  box-shadow: 0 0 16px rgba(109, 40, 217, 0.35);
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
