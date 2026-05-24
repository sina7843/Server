<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/media" class="back-link">← بازگشت به کتابخانه</NuxtLink>
      <h1 class="page-title">آپلود رسانه</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.MEDIA_ASSET_UPLOAD)" />

    <div v-else class="upload-container">
      <MediaUploadForm @uploaded="onUploaded">
        <template #cancel>
          <NuxtLink to="/media" class="cancel-link">انصراف</NuxtLink>
        </template>
      </MediaUploadForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminMediaAssetDto } from '@dragon/sdk';
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.MEDIA_ASSET_UPLOAD,
});

const { hasPermission } = useAdminPermissions();
const router = useRouter();

async function onUploaded(asset: AdminMediaAssetDto) {
  await router.push(`/media/${asset.id}`);
}
</script>

<style scoped>
.page {
  max-width: 640px;
}

.page-header {
  margin-block-end: 1.25rem;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0.25rem 0 0;
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

.upload-container {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.cancel-link {
  padding: 0.45rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  color: #374151;
  font-size: 0.875rem;
  text-decoration: none;
}

.cancel-link:hover {
  background: #f3f4f6;
}
</style>
