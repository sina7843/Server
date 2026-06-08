<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTheme } from '~/composables/useTheme';

useHead({
  meta: [{ name: 'robots', content: 'noindex,nofollow,noarchive' }],
});

const { initTheme } = useTheme();
onMounted(() => {
  initTheme();
});
</script>
