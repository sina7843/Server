<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/media" class="back-link">← بازگشت به کتابخانه</NuxtLink>
      <h1 class="page-title">جزئیات رسانه</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.MEDIA_ASSET_READ)" />

    <LoadingState v-else-if="assetLoading" />

    <ErrorState v-else-if="assetError" :message="assetError" />

    <MediaDetailView v-else-if="asset" :asset="asset" @deleted="onDeleted" />
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.MEDIA_ASSET_READ,
});

const route = useRoute();
const router = useRouter();
const { hasPermission } = useAdminPermissions();
const { asset, assetLoading, assetError, loadAsset } = useAdminMedia();

const id = computed(() => String(route.params.id));

onMounted(async () => {
  if (hasPermission(Permissions.MEDIA_ASSET_READ)) {
    await loadAsset(id.value);
  }
});

async function onDeleted() {
  await router.push('/media');
}
</script>

<style scoped>
.page {
  max-width: 760px;
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
</style>
