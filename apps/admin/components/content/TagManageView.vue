<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">برچسب‌ها</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.CONTENT_TAG_READ)" />

    <template v-else>
      <div v-if="hasPermission(Permissions.CONTENT_TAG_CREATE)" class="create-panel">
        <h2 class="panel-title">{{ editingId ? 'ویرایش برچسب' : 'برچسب جدید' }}</h2>
        <form class="form" @submit.prevent="onSubmit">
          <div class="form-row">
            <div class="field">
              <label for="tag-name" class="field-label">نام <span class="required">*</span></label>
              <input
                id="tag-name"
                v-model="form.name"
                class="field-input"
                type="text"
                maxlength="100"
                required
                placeholder="نام برچسب"
              />
              <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
            </div>

            <div class="field">
              <label for="tag-slug" class="field-label">
                اسلاگ <span class="required">*</span>
                <span class="field-hint">(حروف کوچک، اعداد، خط‌تیره)</span>
              </label>
              <input
                id="tag-slug"
                v-model="form.slug"
                class="field-input"
                type="text"
                maxlength="100"
                :disabled="!!editingId"
                required
                placeholder="مثال: javascript"
              />
              <span v-if="errors.slug" class="field-error">{{ errors.slug }}</span>
            </div>
          </div>

          <div v-if="actionError" class="form-error" role="alert">{{ actionError }}</div>
          <div v-if="actionSuccess" class="form-success" role="status">{{ actionSuccess }}</div>

          <div class="form-actions">
            <button v-if="editingId" class="cancel-btn" type="button" @click="cancelEdit">
              انصراف
            </button>
            <button class="submit-btn" type="submit" :disabled="actionLoading">
              <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
              {{ editingId ? 'ذخیره' : 'ایجاد برچسب' }}
            </button>
          </div>
        </form>
      </div>

      <LoadingState v-if="tagsLoading" />

      <ErrorState v-else-if="tagsError" :message="tagsError" @retry="loadTags" />

      <EmptyState v-else-if="tags.length === 0" label="هیچ برچسبی وجود ندارد." />

      <template v-else>
        <div class="tags-grid">
          <div v-for="tag in tags" :key="tag.id" class="tag-card">
            <span class="tag-name">{{ tag.name }}</span>
            <span class="tag-slug">{{ tag.slug }}</span>
            <div class="tag-actions">
              <button
                v-if="hasPermission(Permissions.CONTENT_TAG_UPDATE)"
                class="action-btn"
                type="button"
                @click="startEdit(tag)"
              >
                ویرایش
              </button>
              <button
                v-if="hasPermission(Permissions.CONTENT_TAG_DELETE)"
                class="action-btn action-btn--delete"
                type="button"
                @click="openDelete(tag.id)"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      </template>
    </template>

    <ConfirmDialog
      :open="deleteDialogOpen"
      title="حذف برچسب"
      description="آیا مطمئن هستید که می‌خواهید این برچسب را حذف کنید (نرم‌حذف)؟"
      confirm-label="حذف"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onConfirmDelete"
      @cancel="deleteDialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';
import type { AdminTagDto } from '@dragon/sdk';

const { hasPermission } = useAdminPermissions();
const {
  tags,
  tagsLoading,
  tagsError,
  actionLoading,
  actionError,
  actionSuccess,
  loadTags,
  createTag,
  updateTag,
  deleteTag,
  clearActionState,
} = useAdminContent();

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

const editingId = ref<string | null>(null);
const deleteDialogOpen = ref(false);
const pendingDeleteId = ref<string | null>(null);

const form = reactive({ name: '', slug: '' });
const errors = reactive({ name: '', slug: '' });

function validate(): boolean {
  errors.name = '';
  errors.slug = '';

  if (!form.name.trim()) {
    errors.name = 'نام الزامی است.';
    return false;
  }

  if (!editingId.value && !SLUG_PATTERN.test(form.slug.trim())) {
    errors.slug =
      'اسلاگ باید فقط شامل حروف کوچک، اعداد و خط‌تیره باشد و با حرف یا عدد شروع/پایان یابد.';
    return false;
  }

  return true;
}

async function onSubmit() {
  if (!validate()) return;
  clearActionState();

  if (editingId.value) {
    await updateTag(editingId.value, { name: form.name.trim() });
    cancelEdit();
  } else {
    await createTag({ name: form.name.trim(), slug: form.slug.trim() });
    form.name = '';
    form.slug = '';
  }
}

function startEdit(tag: AdminTagDto) {
  editingId.value = tag.id;
  form.name = tag.name;
  form.slug = tag.slug;
  clearActionState();
}

function cancelEdit() {
  editingId.value = null;
  form.name = '';
  form.slug = '';
  errors.name = '';
  errors.slug = '';
}

function openDelete(id: string) {
  pendingDeleteId.value = id;
  deleteDialogOpen.value = true;
}

async function onConfirmDelete() {
  if (!pendingDeleteId.value) return;
  await deleteTag(pendingDeleteId.value);
  deleteDialogOpen.value = false;
}

onMounted(loadTags);
</script>

<style scoped>
.page {
  max-width: 900px;
}
.page-header {
  margin-block-end: 1.25rem;
}
.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.create-panel {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-block-end: 1.5rem;
  background: #f8fafc;
}
.panel-title {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
.required {
  color: #ef4444;
  margin-inline-start: 0.1rem;
}

.field-input {
  padding: 0.5rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  background: #fff;
}
.field-input:focus {
  border-color: #3b82f6;
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
.form-success {
  font-size: 0.85rem;
  color: #166534;
  background: #dcfce7;
  padding: 0.5rem 0.85rem;
  border-radius: 0.4rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: flex-end;
}
.cancel-btn {
  font-size: 0.9rem;
  color: #475569;
  background: none;
  border: none;
  cursor: pointer;
}
.cancel-btn:hover {
  text-decoration: underline;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1.1rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
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

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #fff;
  min-width: 160px;
}

.tag-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}
.tag-slug {
  font-size: 0.78rem;
  font-family: monospace;
  color: #64748b;
}
.tag-actions {
  display: flex;
  gap: 0.4rem;
  margin-block-start: 0.4rem;
}

.action-btn {
  font-size: 0.78rem;
  padding: 0.18rem 0.5rem;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  background: #e0f2fe;
  color: #0369a1;
  transition: opacity 0.15s;
}
.action-btn:hover {
  opacity: 0.8;
}
.action-btn--delete {
  background: #fee2e2;
  color: #991b1b;
}
</style>
