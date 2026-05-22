<template>
  <ContentPostFormView type="rule" plural-path="rules" :post-id="route.params.id as string" />
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.CONTENT_POST_UPDATE,
});
useHead({ title: 'ویرایش قانون — Dragon Admin' });

const route = useRoute();
</script>
