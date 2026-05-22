<template>
  <ContentPostListView type="announcement" plural-path="announcements" />
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.CONTENT_POST_READ,
});
useHead({ title: 'اعلانات — Dragon Admin' });
</script>
