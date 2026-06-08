<template>
  <main class="content-page">
    <ContentStateMessage v-if="pending" state="loading" />
    <ContentStateMessage v-else-if="error" state="error" />
    <ContentStateMessage v-else-if="!category" state="not-found" />
    <template v-else>
      <header class="content-page__header">
        <NuxtLink to="/categories" class="content-page__back">
          ← دسته‌بندی‌ها
        </NuxtLink>
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
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.content-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-10);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--glass-hairline);
}

.content-page__title {
  font-size: var(--text-h1-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h1-tracking);
  margin: 0;
  color: var(--text-primary);
}

.content-page__description {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  margin: 0;
}

.content-page__back {
  font-size: var(--text-body-sm-size);
  color: var(--text-muted);
  text-decoration: none;
  transition: color var(--motion-fast);
}

.content-page__back:hover {
  color: var(--purple-300);
}
</style>
