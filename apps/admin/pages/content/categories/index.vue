<template>
  <CategoryManageView />
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.CONTENT_CATEGORY_READ,
});
useHead({ title: 'دسته‌بندی‌ها — Dragon Admin' });
</script>
