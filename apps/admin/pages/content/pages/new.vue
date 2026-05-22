<template>
  <ContentPageFormView />
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.CONTENT_PAGE_CREATE,
});
useHead({ title: 'صفحه جدید — Dragon Admin' });
</script>
