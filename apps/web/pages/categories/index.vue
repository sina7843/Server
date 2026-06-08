<template>
  <main class="categories-page">
    <div class="categories-page__header">
      <span class="dr-label">Browse</span>
      <h1 class="categories-page__title">دسته‌بندی‌ها</h1>
      <p class="categories-page__description">محتوا را بر اساس موضوع مرور کنید.</p>
    </div>

    <ContentStateMessage v-if="pending" state="loading" />
    <ContentStateMessage v-else-if="error" state="error" />
    <div v-else-if="categories.length === 0" class="categories-page__empty">
      <ContentStateMessage state="empty" />
    </div>
    <ul v-else class="categories-page__grid" role="list">
      <li v-for="cat in categories" :key="cat.id">
        <NuxtLink :to="`/categories/${cat.slug}`" class="category-card dr-card">
          <div class="category-card__icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <div class="category-card__body">
            <h2 class="category-card__name">{{ cat.name }}</h2>
            <p v-if="cat.description" class="category-card__description">{{ cat.description }}</p>
          </div>
          <svg class="category-card__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
const content = usePublicContent();
const runtimeConfig = useRuntimeConfig();

const { data, pending, error } = await useAsyncData('categories-list', () =>
  content.listCategories(),
);

const categories = computed(() => data.value?.items ?? []);

const siteName = (runtimeConfig.public?.siteName as string | undefined) ?? 'Dragon';

useHead({
  title: `دسته‌بندی‌ها — ${siteName}`,
  meta: [
    { name: 'description', content: 'مرور محتوا بر اساس دسته‌بندی' },
    { property: 'og:title', content: `دسته‌بندی‌ها — ${siteName}` },
  ],
});
</script>

<style scoped>
.categories-page {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.categories-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-10);
}

.categories-page__title {
  font-size: var(--text-h1-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h1-tracking);
  margin: 0;
  color: var(--text-primary);
}

.categories-page__description {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  margin: 0;
}

.categories-page__empty {
  padding: var(--space-16) 0;
}

.categories-page__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-3);
}

@media (min-width: 640px) {
  .categories-page__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .categories-page__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ── Category card ── */
.category-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  text-decoration: none;
  transition:
    border-color var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-out);
}

.category-card:hover {
  border-color: rgba(109, 40, 217, 0.35);
  box-shadow: var(--shadow-md), 0 0 0 1px rgba(109, 40, 217, 0.1);
  transform: translateY(-2px);
}

.category-card__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: rgba(109, 40, 217, 0.12);
  color: var(--purple-400);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background var(--motion-fast);
}

.category-card:hover .category-card__icon {
  background: rgba(109, 40, 217, 0.22);
}

.category-card__body {
  flex: 1;
  min-width: 0;
}

.category-card__name {
  font-size: var(--text-body-size);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.category-card__description {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  margin: 4px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-card__arrow {
  color: var(--text-disabled);
  flex-shrink: 0;
  transition:
    color var(--motion-fast),
    transform var(--motion-fast) var(--ease-spring);
}

.category-card:hover .category-card__arrow {
  color: var(--purple-400);
  transform: translateX(-3px);
}
</style>
