<template>
  <ContentRevisionListView
    :resource-id="route.params.resourceId as string"
    :resource-type="resourceType"
    :back-path="backPath"
  />
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.CONTENT_POST_READ,
});
useHead({ title: 'تاریخچه نسخه‌ها — Dragon Admin' });

const route = useRoute();

const resourceType = computed(() =>
  route.query.type === 'page' ? ('page' as const) : ('post' as const),
);

const backPath = computed(() => (route.query.back ? String(route.query.back) : '/content'));
</script>
