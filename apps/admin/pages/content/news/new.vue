<template>
  <ContentPostFormView type="news" plural-path="news" />
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.CONTENT_POST_CREATE,
});
useHead({ title: 'خبر جدید — Dragon Admin' });
</script>
