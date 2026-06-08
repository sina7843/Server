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
  max-width: var(--layout-prose-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.content-article__header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--glass-hairline);
}

.content-article__title {
  font-size: var(--text-h1-size);
  font-weight: var(--weight-bold);
  line-height: var(--text-h1-lh);
  margin: 0;
  color: var(--text-primary);
}

.content-article__body {
  font-size: var(--text-body-size);
  line-height: 1.8;
  color: var(--text-secondary);
}
</style>
