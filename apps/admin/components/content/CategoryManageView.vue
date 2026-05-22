<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">دسته‌بندی‌ها</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.CONTENT_CATEGORY_READ)" />

    <template v-else>
      <div v-if="hasPermission(Permissions.CONTENT_CATEGORY_CREATE)" class="create-panel">
        <h2 class="panel-title">{{ editingId ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید' }}</h2>
        <form class="form" @submit.prevent="onSubmit">
          <div class="field">
            <label for="cat-name" class="field-label">نام <span class="required">*</span></label>
            <input
              id="cat-name"
              v-model="form.name"
              class="field-input"
              type="text"
              maxlength="200"
              required
              placeholder="نام دسته‌بندی"
            />
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
          </div>

          <div class="field">
            <label for="cat-slug" class="field-label">
              اسلاگ <span class="required">*</span>
              <span class="field-hint">(حروف کوچک، اعداد، خط‌تیره)</span>
            </label>
            <input
              id="cat-slug"
              v-model="form.slug"
              class="field-input"
              type="text"
              maxlength="200"
              :disabled="!!editingId"
              required
              placeholder="مثال: technology"
            />
            <span v-if="errors.slug" class="field-error">{{ errors.slug }}</span>
          </div>

          <div class="field">
            <label for="cat-desc" class="field-label">
              توضیحات <span class="field-hint">(اختیاری)</span>
            </label>
            <textarea
              id="cat-desc"
              v-model="form.description"
              class="field-textarea"
              rows="2"
              maxlength="500"
              placeholder="توضیح کوتاه"
            />
          </div>

          <div class="field">
            <label for="cat-parent" class="field-label">
              دسته‌بندی والد <span class="field-hint">(اختیاری)</span>
            </label>
            <select id="cat-parent" v-model="form.parentId" class="field-select">
              <option value="">بدون والد</option>
              <option
                v-for="cat in categories.filter((c) => c.id !== editingId)"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="field">
            <label for="cat-order" class="field-label">
              ترتیب <span class="field-hint">(اختیاری)</span>
            </label>
            <input
              id="cat-order"
              v-model.number="form.sortOrder"
              class="field-input"
              type="number"
              min="0"
              placeholder="0"
            />
          </div>

          <div v-if="actionError" class="form-error" role="alert">{{ actionError }}</div>
          <div v-if="actionSuccess" class="form-success" role="status">{{ actionSuccess }}</div>

          <div class="form-actions">
            <button v-if="editingId" class="cancel-btn" type="button" @click="cancelEdit">
              انصراف
            </button>
            <button class="submit-btn" type="submit" :disabled="actionLoading">
              <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
              {{ editingId ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی' }}
            </button>
          </div>
        </form>
      </div>

      <LoadingState v-if="categoriesLoading" />

      <ErrorState v-else-if="categoriesError" :message="categoriesError" @retry="loadCategories" />

      <EmptyState v-else-if="categories.length === 0" label="هیچ دسته‌بندی‌ای وجود ندارد." />

      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="th">نام</th>
                <th class="th">اسلاگ</th>
                <th class="th">والد</th>
                <th class="th">ترتیب</th>
                <th class="th" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in categories" :key="cat.id" class="tr">
                <td class="td td--name">{{ cat.name }}</td>
                <td class="td td--slug">{{ cat.slug }}</td>
                <td class="td">{{ parentName(cat.parentId) }}</td>
                <td class="td">{{ cat.sortOrder }}</td>
                <td class="td td--actions">
                  <button
                    v-if="hasPermission(Permissions.CONTENT_CATEGORY_UPDATE)"
                    class="action-btn"
                    type="button"
                    @click="startEdit(cat)"
                  >
                    ویرایش
                  </button>
                  <button
                    v-if="hasPermission(Permissions.CONTENT_CATEGORY_DELETE)"
                    class="action-btn action-btn--delete"
                    type="button"
                    @click="openDelete(cat.id)"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <ConfirmDialog
      :open="deleteDialogOpen"
      title="حذف دسته‌بندی"
      description="آیا مطمئن هستید؟ این دسته‌بندی حذف می‌شود (نرم‌حذف)."
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
import type { AdminCategoryDto } from '@dragon/sdk';

const { hasPermission } = useAdminPermissions();
const {
  categories,
  categoriesLoading,
  categoriesError,
  actionLoading,
  actionError,
  actionSuccess,
  loadCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  clearActionState,
} = useAdminContent();

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

const editingId = ref<string | null>(null);
const deleteDialogOpen = ref(false);
const pendingDeleteId = ref<string | null>(null);

const form = reactive({
  name: '',
  slug: '',
  description: '',
  parentId: '',
  sortOrder: 0,
});

const errors = reactive({ name: '', slug: '' });

function parentName(parentId?: string): string {
  if (!parentId) return '—';
  return categories.value.find((c) => c.id === parentId)?.name ?? parentId;
}

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

  const seoInput = {
    name: form.name.trim(),
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
    ...(form.parentId ? { parentId: form.parentId } : {}),
    sortOrder: form.sortOrder,
  };

  if (editingId.value) {
    await updateCategory(editingId.value, seoInput);
    cancelEdit();
  } else {
    await createCategory({ ...seoInput, slug: form.slug.trim() });
    form.name = '';
    form.slug = '';
    form.description = '';
    form.parentId = '';
    form.sortOrder = 0;
  }
}

function startEdit(cat: AdminCategoryDto) {
  editingId.value = cat.id;
  form.name = cat.name;
  form.slug = cat.slug;
  form.description = cat.description ?? '';
  form.parentId = cat.parentId ?? '';
  form.sortOrder = cat.sortOrder;
  clearActionState();
}

function cancelEdit() {
  editingId.value = null;
  form.name = '';
  form.slug = '';
  form.description = '';
  form.parentId = '';
  form.sortOrder = 0;
  errors.name = '';
  errors.slug = '';
}

function openDelete(id: string) {
  pendingDeleteId.value = id;
  deleteDialogOpen.value = true;
}

async function onConfirmDelete() {
  if (!pendingDeleteId.value) return;
  await deleteCategory(pendingDeleteId.value);
  deleteDialogOpen.value = false;
}

onMounted(loadCategories);
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

.field-input,
.field-textarea,
.field-select {
  padding: 0.5rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  background: #fff;
}
.field-input:focus,
.field-textarea:focus,
.field-select:focus {
  border-color: #3b82f6;
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

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.th {
  padding: 0.7rem 1rem;
  text-align: start;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border-block-end: 1px solid #e2e8f0;
  white-space: nowrap;
}
.tr:not(:last-child) {
  border-block-end: 1px solid #f1f5f9;
}
.td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #334155;
  vertical-align: middle;
}
.td--name {
  font-weight: 500;
}
.td--slug {
  font-family: monospace;
  font-size: 0.8rem;
  color: #64748b;
}
.td--actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  font-size: 0.82rem;
  padding: 0.2rem 0.55rem;
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
