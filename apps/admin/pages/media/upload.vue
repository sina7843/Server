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
  color: var(--text-primary);
  margin: 0.25rem 0 0;
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

.upload-container {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 1.5rem;
}

.cancel-link {
  height: 34px;
  padding: 0 1rem;
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-decoration: none;
  transition: all var(--motion-fast);
}

.cancel-link:hover {
  background: var(--hover-overlay);
  color: var(--text-primary);
}
</style>
