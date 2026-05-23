<template>
  <main class="content-page">
    <ContentStateMessage v-if="pending" state="loading" />
    <ContentStateMessage v-else-if="error" state="error" />
    <ContentStateMessage v-else-if="!post" state="not-found" />
    <ContentArticle v-else :post="post" />
  </main>
</template>

<script setup lang="ts">
import { buildContentSeoHead } from '../../features/content/content-seo';

const route = useRoute();
const slug = route.params.slug as string;
const content = usePublicContent();

const { data, pending, error } = await useAsyncData(`guide-${slug}`, async () => {
  try {
    return await content.getGuide(slug);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('404')) return null;
    throw err;
  }
});

const post = computed(() => data.value?.post ?? null);
const isAbsent = computed(() => !pending.value && !post.value);

useHead(
  computed(() =>
    buildContentSeoHead({
      title: post.value?.title ?? 'راهنما یافت نشد',
      seo: post.value?.seo,
      noIndex: isAbsent.value || !!error.value,
    }),
  ),
);
</script>

<style scoped>
.content-page {
  max-width: 56rem;
  margin: 2rem auto;
  padding: 0 1rem;
}
</style>
