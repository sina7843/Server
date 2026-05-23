<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  meta: [{ name: 'robots', content: 'noindex,nofollow,noarchive' }],
});
</script>
