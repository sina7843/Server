<template>
  <main class="content-page">
    <ContentStateMessage v-if="pending" state="loading" />
    <ContentStateMessage v-else-if="error" state="error" />
    <ContentStateMessage v-else-if="!page" state="not-found" />
    <article v-else class="content-article">
      <header class="content-article__header">
        <h1 class="content-article__title">{{ page.title }}</h1>
      </header>
      <ContentHtmlRenderer :html="page.bodyHtml" class="content-article__body" />
    </article>
  </main>
</template>

<script setup lang="ts">
import { buildContentSeoHead } from '../../features/content/content-seo';

const route = useRoute();
const slug = route.params.slug as string;
const content = usePublicContent();

const { data, pending, error } = await useAsyncData(`page-${slug}`, async () => {
  try {
    return await content.getPage(slug);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('404')) return null;
    throw err;
  }
});

const page = computed(() => data.value?.page ?? null);
const isAbsent = computed(() => !pending.value && !page.value);

useHead(
  computed(() =>
    buildContentSeoHead({
      title: page.value?.title ?? 'صفحه یافت نشد',
      seo: page.value?.seo,
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

.content-article__header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.content-article__title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
  color: #1e293b;
}

.content-article__body {
  font-size: 1rem;
  line-height: 1.8;
  color: #1e293b;
}
</style>
