<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">کتابخانه رسانه</h1>
      <NuxtLink
        v-if="hasPermission(Permissions.MEDIA_ASSET_UPLOAD)"
        to="/media/upload"
        class="upload-btn"
      >
        آپلود رسانه
      </NuxtLink>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.MEDIA_ASSET_READ)" />

    <template v-else>
      <div class="filters">
        <input
          v-model="searchQuery"
          class="search-input"
          type="search"
          placeholder="جستجو در رسانه‌ها…"
          @input="onSearchInput"
        />

        <template v-if="!searchMode">
          <select v-model="filterVisibility" class="filter-select" @change="onFilterChange">
            <option value="">همه (نمایش)</option>
            <option value="public">عمومی</option>
            <option value="private">خصوصی</option>
          </select>

          <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
            <option value="">همه وضعیت‌ها</option>
            <option value="ready">آماده</option>
            <option value="processing">در پردازش</option>
            <option value="failed">خطا</option>
          </select>

          <select v-model="filterMimeType" class="filter-select" @change="onFilterChange">
            <option value="">همه فرمت‌ها</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
            <option value="image/gif">GIF</option>
          </select>
        </template>
      </div>

      <!-- Search mode: results from admin search API -->
      <template v-if="searchMode">
        <LoadingState v-if="mediaLoading" />
        <ErrorState v-else-if="mediaError" :message="mediaError" @retry="runSearch" />
        <EmptyState v-else-if="mediaItems.length === 0" label="رسانه‌ای یافت نشد." />
        <template v-else>
          <div class="search-results">
            <div v-for="item in mediaItems" :key="item.id" class="search-result-item">
              <span class="search-result-item__name">{{ item.title }}</span>
              <span v-if="item.status" class="search-result-item__status">{{ item.status }}</span>
            </div>
          </div>
          <div class="pagination">
            <button
              class="page-btn"
              type="button"
              :disabled="mediaPage <= 1"
              @click="goToSearchPage(mediaPage - 1)"
            >
              قبلی
            </button>
            <span class="page-info">صفحه {{ mediaPage }}</span>
            <button
              class="page-btn"
              type="button"
              :disabled="mediaItems.length < MEDIA_LIMIT"
              @click="goToSearchPage(mediaPage + 1)"
            >
              بعدی
            </button>
          </div>
        </template>
      </template>

      <!-- Browse mode: media grid with filters -->
      <template v-else>
        <MediaGrid
          :assets="assets"
          :total="assetsTotal"
          :page="assetsPage"
          :limit="assetsLimit"
          :loading="assetsLoading"
          :error="assetsError"
          @select="onSelect"
          @page-change="onPageChange"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AdminMediaAssetDto } from '@dragon/sdk';
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.MEDIA_ASSET_READ,
});

const { hasPermission } = useAdminPermissions();
const { assets, assetsTotal, assetsPage, assetsLimit, assetsLoading, assetsError, loadMedia } =
  useAdminMedia();
const { mediaItems, mediaLoading, mediaError, mediaPage, searchMedia } = useAdminSearch();
const router = useRouter();

const MEDIA_LIMIT = 24;

const searchQuery = ref('');
const filterVisibility = ref('');
const filterStatus = ref('');
const filterMimeType = ref('');

const searchMode = computed(() => searchQuery.value.trim().length > 0);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function buildBrowseParams(page = 1) {
  return {
    ...(filterVisibility.value
      ? { visibility: filterVisibility.value as 'public' | 'private' }
      : {}),
    ...(filterStatus.value
      ? { status: filterStatus.value as 'ready' | 'processing' | 'failed' | 'uploaded' }
      : {}),
    ...(filterMimeType.value ? { mimeType: filterMimeType.value } : {}),
    page,
    limit: MEDIA_LIMIT,
  };
}

async function runSearch(page = mediaPage.value) {
  await searchMedia({
    ...(searchQuery.value.trim() ? { q: searchQuery.value.trim() } : {}),
    page,
    limit: MEDIA_LIMIT,
  });
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (searchQuery.value.trim()) {
      await runSearch(1);
    } else {
      void loadMedia(buildBrowseParams(1));
    }
  }, 350);
}

function onFilterChange() {
  void loadMedia(buildBrowseParams(1));
}

function onPageChange(page: number) {
  void loadMedia(buildBrowseParams(page));
}

async function goToSearchPage(page: number) {
  await runSearch(page);
}

function onSelect(asset: AdminMediaAssetDto) {
  void router.push(`/media/${asset.id}`);
}

onMounted(() => {
  if (hasPermission(Permissions.MEDIA_ASSET_READ)) {
    void loadMedia(buildBrowseParams());
  }
});
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
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  background: var(--purple-500);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 6px 20px -6px rgba(109, 40, 217, 0.5);
  transition: all var(--motion-fast);
}

.upload-btn:hover {
  background: var(--purple-400);
}

.filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-block-end: 1.25rem;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 180px;
  height: 34px;
  padding: 0 0.75rem;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--text-primary);
  background: var(--input-bg);
  font-family: inherit;
  outline: none;
  transition: border-color var(--motion-fast);
}

.search-input:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.filter-select {
  height: 34px;
  padding: 0 0.75rem;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--input-bg);
  font-family: inherit;
  outline: none;
  cursor: pointer;
  transition: border-color var(--motion-fast);
}

.filter-select:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
}

.search-result-item__name {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
}

.search-result-item__status {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-block-start: 16px;
  justify-content: flex-end;
}

.page-btn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  background: var(--input-bg);
  cursor: pointer;
  color: var(--text-secondary);
  font-family: inherit;
  transition: all var(--motion-fast);
}

.page-btn:not(:disabled):hover {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.85rem;
  color: var(--text-muted);
}
</style>
