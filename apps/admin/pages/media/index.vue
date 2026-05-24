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
      </div>

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
const router = useRouter();

const filterVisibility = ref('');
const filterStatus = ref('');
const filterMimeType = ref('');

function buildParams(page = 1) {
  return {
    ...(filterVisibility.value
      ? { visibility: filterVisibility.value as 'public' | 'private' }
      : {}),
    ...(filterStatus.value
      ? { status: filterStatus.value as 'ready' | 'processing' | 'failed' | 'uploaded' }
      : {}),
    ...(filterMimeType.value ? { mimeType: filterMimeType.value } : {}),
    page,
    limit: 24,
  };
}

function onFilterChange() {
  void loadMedia(buildParams(1));
}

function onPageChange(page: number) {
  void loadMedia(buildParams(page));
}

function onSelect(asset: AdminMediaAssetDto) {
  void router.push(`/media/${asset.id}`);
}

onMounted(() => {
  if (hasPermission(Permissions.MEDIA_ASSET_READ)) {
    void loadMedia(buildParams());
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
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.upload-btn {
  padding: 0.45rem 1.1rem;
  background: #3b82f6;
  color: #fff;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
}

.upload-btn:hover {
  background: #2563eb;
}

.filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-block-end: 1.25rem;
}

.filter-select {
  padding: 0.4rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #374151;
  background: #fff;
}
</style>
