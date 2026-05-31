<template>
  <form class="form" @submit.prevent="onSubmit">
    <div class="field">
      <label for="name-input" class="field-label">نام بازی</label>
      <input
        id="name-input"
        v-model="form.name"
        class="field-input"
        type="text"
        placeholder="مثال: Counter-Strike 2"
        maxlength="128"
        required
      />
      <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
    </div>

    <div class="field">
      <label for="slug-input" class="field-label">
        اسلاگ
        <span class="field-hint">حروف کوچک، اعداد و خط تیره</span>
      </label>
      <input
        id="slug-input"
        v-model="form.slug"
        class="field-input"
        type="text"
        placeholder="مثال: counter-strike-2"
        maxlength="128"
        :disabled="editMode"
        required
      />
      <span v-if="errors.slug" class="field-error">{{ errors.slug }}</span>
    </div>

    <div class="field">
      <label for="status-select" class="field-label">وضعیت</label>
      <select id="status-select" v-model="form.status" class="field-select">
        <option value="active">فعال</option>
        <option value="inactive">غیرفعال</option>
        <option value="archived">بایگانی</option>
      </select>
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
        rows="3"
        maxlength="1000"
        placeholder="توضیح کوتاه درباره این بازی…"
      />
    </div>

    <div v-if="actionError" class="form-error" role="alert">{{ actionError }}</div>

    <div class="form-actions">
      <NuxtLink to="/games" class="cancel-btn">انصراف</NuxtLink>
      <button class="submit-btn" type="submit" :disabled="actionLoading">
        <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { GameDto, GameStatus } from '@dragon/types';

const props = withDefaults(
  defineProps<{
    initial?: Partial<GameDto>;
    editMode?: boolean;
    actionLoading?: boolean;
    actionError?: string | null;
    submitLabel?: string;
  }>(),
  {
    initial: undefined,
    editMode: false,
    actionLoading: false,
    actionError: null,
    submitLabel: 'ذخیره',
  },
);

const emit = defineEmits<{
  submit: [data: { name: string; slug: string; status: GameStatus; description?: string }];
}>();

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const form = reactive({
  name: props.initial?.name ?? '',
  slug: props.initial?.slug ?? '',
  status: (props.initial?.status ?? 'active') as GameStatus,
  description: props.initial?.description ?? '',
});

const errors = reactive({ name: '', slug: '' });

function validate(): boolean {
  errors.name = '';
  errors.slug = '';

  if (!form.name.trim()) {
    errors.name = 'نام الزامی است.';
    return false;
  }

  if (!props.editMode) {
    if (!form.slug.trim()) {
      errors.slug = 'اسلاگ الزامی است.';
      return false;
    }
    if (!SLUG_PATTERN.test(form.slug)) {
      errors.slug =
        'اسلاگ باید با حرف یا عدد شروع شود و فقط حروف کوچک، اعداد و خط تیره داشته باشد.';
      return false;
    }
  }

  return true;
}

function onSubmit() {
  if (!validate()) return;

  emit('submit', {
    name: form.name.trim(),
    slug: form.slug,
    status: form.status,
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
  });
}
</script>

<style scoped>
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
.field-select,
.field-textarea {
  padding: 0.5rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  background: #fff;
  color: #1e293b;
}

.field-input:focus,
.field-select:focus,
.field-textarea:focus {
  border-color: #3b82f6;
}

.field-input:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.field-textarea {
  resize: vertical;
}

.field-error {
  font-size: 0.8rem;
  color: #dc2626;
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
