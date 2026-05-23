<template>
  <main class="content-page">
    <ContentStateMessage v-if="pending" state="loading" />
    <ContentStateMessage v-else-if="error" state="error" />
    <ContentStateMessage v-else-if="!category" state="not-found" />
    <template v-else>
      <header class="content-page__header">
        <h1 class="content-page__title">{{ category.name }}</h1>
        <p v-if="category.description" class="content-page__description">
          {{ category.description }}
        </p>
      </header>
      <ContentStateMessage state="empty" />
    </template>
  </main>
</template>

<script setup lang="ts">
import { buildContentSeoHead } from '../../features/content/content-seo';

const route = useRoute();
const slug = route.params.slug as string;
const content = usePublicContent();

const { data, pending, error } = await useAsyncData(`category-${slug}`, async () => {
  try {
    return await content.getCategory(slug);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('404')) return null;
    throw err;
  }
});

const category = computed(() => data.value?.category ?? null);
const isAbsent = computed(() => !pending.value && !category.value);

useHead(
  computed(() =>
    buildContentSeoHead({
      title: category.value?.name ?? 'دسته‌بندی یافت نشد',
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

.content-page__header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.content-page__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #1e293b;
}

.content-page__description {
  color: #475569;
  margin: 0;
}
</style>
