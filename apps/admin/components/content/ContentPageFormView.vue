<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/content/pages" class="back-link">← صفحات</NuxtLink>
      <h1 class="page-title">{{ isEdit ? 'ویرایش صفحه' : 'ایجاد صفحه جدید' }}</h1>
    </div>

    <LoadingState v-if="pageLoading" />

    <ErrorState v-else-if="pageError" :message="pageError" />

    <ForbiddenState v-else-if="isEdit && !hasPermission(Permissions.CONTENT_PAGE_UPDATE)" />
    <ForbiddenState v-else-if="!isEdit && !hasPermission(Permissions.CONTENT_PAGE_CREATE)" />

    <template v-else>
      <form class="form" @submit.prevent="onSubmit">
        <div class="field">
          <label for="title-input" class="field-label">عنوان <span class="required">*</span></label>
          <input
            id="title-input"
            v-model="form.title"
            class="field-input"
            type="text"
            maxlength="500"
            required
            placeholder="عنوان صفحه"
          />
          <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
        </div>

        <div class="field">
          <label for="slug-input" class="field-label">
            اسلاگ (slug)
            <span class="field-hint">حروف کوچک، اعداد و خط‌تیره</span>
            <span class="required">*</span>
          </label>
          <input
            id="slug-input"
            v-model="form.slug"
            class="field-input"
            type="text"
            maxlength="200"
            required
            placeholder="مثال: about-us"
          />
          <span v-if="errors.slug" class="field-error">{{ errors.slug }}</span>
        </div>

        <div class="field">
          <label class="field-label">متن صفحه</label>
          <ClientOnly>
            <ContentRichTextEditor v-model="form.bodyJson" @html="form.bodyHtml = $event" />
            <template #fallback>
              <textarea
                v-model="form.bodyHtml"
                class="field-textarea field-textarea--body"
                rows="12"
                placeholder="متن صفحه را اینجا وارد کنید…"
              />
            </template>
          </ClientOnly>
        </div>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">تنظیمات SEO</legend>

          <div class="field">
            <label for="seo-title" class="field-label">
              عنوان SEO <span class="field-hint">(اختیاری)</span>
            </label>
            <input
              id="seo-title"
              v-model="form.seoTitle"
              class="field-input"
              type="text"
              maxlength="200"
              placeholder="عنوان برای موتورهای جستجو"
            />
          </div>

          <div class="field">
            <label for="seo-desc" class="field-label">
              توضیحات SEO <span class="field-hint">(اختیاری)</span>
            </label>
            <textarea
              id="seo-desc"
              v-model="form.seoDescription"
              class="field-textarea"
              rows="2"
              maxlength="500"
              placeholder="توضیحات برای موتورهای جستجو"
            />
          </div>

          <div class="field">
            <label for="canonical" class="field-label">
              آدرس canonical <span class="field-hint">(اختیاری)</span>
            </label>
            <input
              id="canonical"
              v-model="form.canonicalUrl"
              class="field-input"
              type="url"
              placeholder="https://example.com/my-page"
            />
            <span v-if="errors.canonicalUrl" class="field-error">{{ errors.canonicalUrl }}</span>
          </div>

          <div class="field field-inline">
            <label class="toggle-label">
              <input v-model="form.noIndex" type="checkbox" class="toggle-input" />
              <span>عدم ایندکس (noindex)</span>
            </label>
          </div>
        </fieldset>

        <div v-if="isEdit && page" class="status-row">
          <span class="status-label">وضعیت فعلی:</span>
          <ContentStatusBadge :status="page.status" />
        </div>

        <div v-if="actionError" class="form-error" role="alert">{{ actionError }}</div>
        <div v-if="actionSuccess" class="form-success" role="status">{{ actionSuccess }}</div>

        <div class="form-actions">
          <NuxtLink to="/content/pages" class="cancel-btn">انصراف</NuxtLink>
          <button class="submit-btn" type="submit" :disabled="actionLoading">
            <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
            {{ isEdit ? 'ذخیره تغییرات' : 'ایجاد صفحه' }}
          </button>
        </div>
      </form>

      <template v-if="isEdit && page">
        <div class="lifecycle-actions">
          <button
            v-if="hasPermission(Permissions.CONTENT_PAGE_PUBLISH) && page.status === 'draft'"
            class="lifecycle-btn lifecycle-btn--publish"
            type="button"
            @click="publishDialogOpen = true"
          >
            انتشار صفحه
          </button>
          <button
            v-if="hasPermission(Permissions.CONTENT_PAGE_ARCHIVE) && page.status === 'published'"
            class="lifecycle-btn lifecycle-btn--archive"
            type="button"
            @click="archiveDialogOpen = true"
          >
            بایگانی صفحه
          </button>
          <button
            v-if="hasPermission(Permissions.CONTENT_PAGE_UPDATE)"
            class="lifecycle-btn lifecycle-btn--delete"
            type="button"
            @click="deleteDialogOpen = true"
          >
            حذف (نرم‌حذف)
          </button>
        </div>

        <ConfirmDialog
          :open="publishDialogOpen"
          title="انتشار صفحه"
          description="آیا مطمئن هستید که می‌خواهید این صفحه را منتشر کنید؟"
          confirm-label="انتشار"
          :loading="actionLoading"
          @confirm="onConfirmPublish"
          @cancel="publishDialogOpen = false"
        />

        <ConfirmDialog
          :open="archiveDialogOpen"
          title="بایگانی صفحه"
          description="آیا مطمئن هستید که می‌خواهید این صفحه را بایگانی کنید؟"
          confirm-label="بایگانی"
          :loading="actionLoading"
          @confirm="onConfirmArchive"
          @cancel="archiveDialogOpen = false"
        />

        <ConfirmDialog
          :open="deleteDialogOpen"
          title="حذف صفحه"
          description="این صفحه حذف می‌شود (نرم‌حذف). عملیات برگشت‌پذیر است."
          confirm-label="حذف"
          :destructive="true"
          :loading="actionLoading"
          @confirm="onConfirmDelete"
          @cancel="deleteDialogOpen = false"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

const props = defineProps<{
  pageId?: string;
}>();

const isEdit = computed(() => !!props.pageId);

const router = useRouter();
const { hasPermission } = useAdminPermissions();
const {
  page,
  pageLoading,
  pageError,
  actionLoading,
  actionError,
  actionSuccess,
  loadPage,
  createPage,
  updatePage,
  publishPage,
  archivePage,
  softDeletePage,
  clearActionState,
} = useAdminContent();

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

const form = reactive({
  title: '',
  slug: '',
  bodyJson: {} as Record<string, unknown>,
  bodyHtml: '',
  seoTitle: '',
  seoDescription: '',
  canonicalUrl: '',
  noIndex: false,
});

const errors = reactive({
  title: '',
  slug: '',
  canonicalUrl: '',
});

const publishDialogOpen = ref(false);
const archiveDialogOpen = ref(false);
const deleteDialogOpen = ref(false);

function validate(): boolean {
  errors.title = '';
  errors.slug = '';
  errors.canonicalUrl = '';

  if (!form.title.trim()) {
    errors.title = 'عنوان الزامی است.';
    return false;
  }

  if (!form.slug.trim()) {
    errors.slug = 'اسلاگ الزامی است.';
    return false;
  }

  if (!SLUG_PATTERN.test(form.slug)) {
    errors.slug =
      'اسلاگ باید فقط شامل حروف کوچک انگلیسی، اعداد و خط‌تیره باشد و با حرف یا عدد شروع/پایان یابد.';
    return false;
  }

  if (form.canonicalUrl && !form.canonicalUrl.startsWith('https://')) {
    errors.canonicalUrl = 'آدرس canonical باید با https:// شروع شود.';
    return false;
  }

  return true;
}

async function onSubmit() {
  if (!validate()) return;
  clearActionState();

  const seo = {
    ...(form.seoTitle.trim() ? { title: form.seoTitle.trim() } : {}),
    ...(form.seoDescription.trim() ? { description: form.seoDescription.trim() } : {}),
    ...(form.canonicalUrl.trim() ? { canonicalUrl: form.canonicalUrl.trim() } : {}),
    ...(form.noIndex ? { noIndex: true } : {}),
  };

  const bodyJson = Object.keys(form.bodyJson).length > 0 ? form.bodyJson : undefined;
  const bodyHtml = form.bodyHtml || undefined;

  if (isEdit.value && props.pageId) {
    const updated = await updatePage(props.pageId, {
      title: form.title.trim(),
      slug: form.slug.trim(),
      bodyJson,
      bodyHtml,
      seo,
    });
    if (updated) await router.push('/content/pages');
  } else {
    const created = await createPage({
      title: form.title.trim(),
      slug: form.slug.trim(),
      bodyJson,
      bodyHtml,
      seo,
    });
    if (created) await router.push(`/content/pages/${created.id}/edit`);
  }
}

async function onConfirmPublish() {
  if (!props.pageId) return;
  const ok = await publishPage(props.pageId);
  publishDialogOpen.value = false;
  if (ok) await router.push('/content/pages');
}

async function onConfirmArchive() {
  if (!props.pageId) return;
  const ok = await archivePage(props.pageId);
  archiveDialogOpen.value = false;
  if (ok) await router.push('/content/pages');
}

async function onConfirmDelete() {
  if (!props.pageId) return;
  const ok = await softDeletePage(props.pageId);
  deleteDialogOpen.value = false;
  if (ok) await router.push('/content/pages');
}

onMounted(async () => {
  if (isEdit.value && props.pageId) {
    await loadPage(props.pageId);
    if (page.value) {
      form.title = page.value.title;
      form.slug = page.value.slug;
      form.bodyJson = page.value.bodyJson ?? {};
      form.bodyHtml = page.value.bodyHtml;
      form.seoTitle = page.value.seo?.title ?? '';
      form.seoDescription = page.value.seo?.description ?? '';
      form.canonicalUrl = page.value.seo?.canonicalUrl ?? '';
      form.noIndex = page.value.seo?.noIndex ?? false;
    }
  }
});
</script>

<style scoped>
.page {
  max-width: 760px;
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
.required {
  color: #ef4444;
  margin-inline-start: 0.1rem;
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
.field-textarea--body {
  font-family: monospace;
  font-size: 0.85rem;
  min-height: 200px;
}
.field-error {
  font-size: 0.8rem;
  color: #dc2626;
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
  color: #374151;
  cursor: pointer;
}
.toggle-input {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.fieldset {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.fieldset-legend {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  padding-inline: 0.4rem;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.875rem;
}
.status-label {
  color: #64748b;
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

.lifecycle-actions {
  display: flex;
  gap: 0.75rem;
  margin-block-start: 1.5rem;
  padding-block-start: 1rem;
  border-block-start: 1px solid #e2e8f0;
  flex-wrap: wrap;
}
.lifecycle-btn {
  padding: 0.45rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.lifecycle-btn:hover {
  opacity: 0.85;
}
.lifecycle-btn--publish {
  background: #dcfce7;
  color: #166534;
}
.lifecycle-btn--archive {
  background: #fef9c3;
  color: #854d0e;
}
.lifecycle-btn--delete {
  background: #fee2e2;
  color: #991b1b;
}
</style>
