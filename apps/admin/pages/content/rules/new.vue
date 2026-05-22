<template>
  <ContentPostFormView type="rule" plural-path="rules" />
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.CONTENT_POST_CREATE,
});
useHead({ title: 'قانون جدید — Dragon Admin' });
</script>
