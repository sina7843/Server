<template>
  <ContentPageFormView :page-id="route.params.id as string" />
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.CONTENT_PAGE_UPDATE,
});
useHead({ title: 'ویرایش صفحه — Dragon Admin' });

const route = useRoute();
</script>
