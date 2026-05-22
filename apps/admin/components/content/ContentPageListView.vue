<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">صفحات</h1>
      <NuxtLink
        v-if="hasPermission(Permissions.CONTENT_PAGE_CREATE)"
        to="/content/pages/new"
        class="create-btn"
      >
        + ایجاد صفحه
      </NuxtLink>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.CONTENT_PAGE_READ)" />

    <template v-else>
      <div class="filters">
        <select v-model="statusFilter" class="status-select" @change="onFilterChange">
          <option value="">همه وضعیت‌ها</option>
          <option value="draft">پیش‌نویس</option>
          <option value="published">منتشرشده</option>
          <option value="archived">بایگانی</option>
        </select>
      </div>

      <LoadingState v-if="pagesLoading" />

      <ErrorState v-else-if="pagesError" :message="pagesError" @retry="reload" />

      <EmptyState
        v-else-if="pages.length === 0 && !statusFilter"
        label="هیچ صفحه‌ای وجود ندارد."
        hint="برای شروع یک صفحه جدید ایجاد کنید."
      />

      <EmptyState v-else-if="pages.length === 0" label="موردی با این وضعیت یافت نشد." />

      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="th">عنوان</th>
                <th class="th">اسلاگ</th>
                <th class="th">وضعیت</th>
                <th class="th">آخرین ویرایش</th>
                <th class="th" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="pg in pages" :key="pg.id" class="tr">
                <td class="td td--title">{{ pg.title }}</td>
                <td class="td td--slug">{{ pg.slug }}</td>
                <td class="td">
                  <ContentStatusBadge :status="pg.status" />
                </td>
                <td class="td td--date">{{ formatDate(pg.updatedAt) }}</td>
                <td class="td td--actions">
                  <NuxtLink :to="`/content/pages/${pg.id}/edit`" class="action-link">
                    ویرایش
                  </NuxtLink>
                  <NuxtLink :to="`/content/pages/${pg.id}/preview`" class="action-link">
                    پیش‌نمایش
                  </NuxtLink>
                  <button
                    v-if="hasPermission(Permissions.CONTENT_PAGE_PUBLISH) && pg.status === 'draft'"
                    class="action-btn action-btn--publish"
                    type="button"
                    @click="openPublish(pg.id)"
                  >
                    انتشار
                  </button>
                  <button
                    v-if="
                      hasPermission(Permissions.CONTENT_PAGE_ARCHIVE) && pg.status === 'published'
                    "
                    class="action-btn action-btn--archive"
                    type="button"
                    @click="openArchive(pg.id)"
                  >
                    بایگانی
                  </button>
                  <button
                    v-if="hasPermission(Permissions.CONTENT_PAGE_UPDATE)"
                    class="action-btn action-btn--delete"
                    type="button"
                    @click="openDelete(pg.id)"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button
            class="page-btn"
            type="button"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            قبلی
          </button>
          <span class="page-info">صفحه {{ currentPage }}</span>
          <button
            class="page-btn"
            type="button"
            :disabled="pages.length < PAGE_LIMIT"
            @click="goToPage(currentPage + 1)"
          >
            بعدی
          </button>
        </div>
      </template>
    </template>

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
      description="این صفحه حذف می‌شود. عملیات حذف قابل بازگشت است (نرم‌حذف)."
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

const { hasPermission } = useAdminPermissions();
const {
  pages,
  pagesLoading,
  pagesError,
  actionLoading,
  loadPages,
  publishPage,
  archivePage,
  softDeletePage,
} = useAdminContent();

const PAGE_LIMIT = 20;

const statusFilter = ref('');
const currentPage = ref(1);

const publishDialogOpen = ref(false);
const archiveDialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const pendingId = ref<string | null>(null);

function buildParams(page = currentPage.value) {
  return {
    ...(statusFilter.value ? { status: statusFilter.value } : {}),
    page,
    limit: PAGE_LIMIT,
  };
}

async function reload(page = currentPage.value) {
  await loadPages(buildParams(page));
}

async function onFilterChange() {
  currentPage.value = 1;
  await reload(1);
}

async function goToPage(page: number) {
  currentPage.value = page;
  await reload(page);
}

function openPublish(id: string) {
  pendingId.value = id;
  publishDialogOpen.value = true;
}

function openArchive(id: string) {
  pendingId.value = id;
  archiveDialogOpen.value = true;
}

function openDelete(id: string) {
  pendingId.value = id;
  deleteDialogOpen.value = true;
}

async function onConfirmPublish() {
  if (!pendingId.value) return;
  const ok = await publishPage(pendingId.value);
  publishDialogOpen.value = false;
  if (ok) await reload();
}

async function onConfirmArchive() {
  if (!pendingId.value) return;
  const ok = await archivePage(pendingId.value);
  archiveDialogOpen.value = false;
  if (ok) await reload();
}

async function onConfirmDelete() {
  if (!pendingId.value) return;
  const ok = await softDeletePage(pendingId.value);
  deleteDialogOpen.value = false;
  if (ok) await reload();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

onMounted(reload);
</script>

<style scoped>
.page {
  max-width: 1100px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 1.25rem;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1rem;
  background: #3b82f6;
  color: #fff;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;
}

.create-btn:hover {
  background: #2563eb;
}

.filters {
  margin-block-end: 1rem;
}

.status-select {
  padding: 0.5rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  background: #fff;
  outline: none;
  cursor: pointer;
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

.td--title {
  font-weight: 500;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.td--slug {
  color: #64748b;
  font-family: monospace;
  font-size: 0.8rem;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.td--date {
  color: #64748b;
  white-space: nowrap;
}
.td--actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.action-link {
  font-size: 0.82rem;
  color: #3b82f6;
  text-decoration: none;
}
.action-link:hover {
  text-decoration: underline;
}

.action-btn {
  font-size: 0.82rem;
  padding: 0.2rem 0.55rem;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: opacity 0.15s;
}

.action-btn--publish {
  background: #dcfce7;
  color: #166534;
}
.action-btn--archive {
  background: #fef9c3;
  color: #854d0e;
}
.action-btn--delete {
  background: #fee2e2;
  color: #991b1b;
}
.action-btn:hover {
  opacity: 0.8;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-block-start: 1rem;
  justify-content: flex-end;
}

.page-btn {
  padding: 0.4rem 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  background: #fff;
  cursor: pointer;
  color: #334155;
  transition: background 0.15s;
}

.page-btn:not(:disabled):hover {
  background: #f1f5f9;
}
.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.page-info {
  font-size: 0.85rem;
  color: #64748b;
}
</style>
