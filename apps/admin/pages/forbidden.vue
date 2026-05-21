<template>
  <ForbiddenState />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
useHead({ meta: [{ name: 'robots', content: 'noindex' }], title: '403 — Forbidden' });
</script>
