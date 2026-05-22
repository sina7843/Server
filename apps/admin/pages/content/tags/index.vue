<template>
  <TagManageView />
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.CONTENT_TAG_READ,
});
useHead({ title: 'برچسب‌ها — Dragon Admin' });
</script>
