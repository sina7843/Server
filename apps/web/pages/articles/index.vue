<template>
  <main class="content-page">
    <div class="content-page__header">
      <span class="dr-label">Articles</span>
      <h1 class="content-page__title">مقالات</h1>
    </div>
    <ContentStateMessage v-if="pending" state="loading" />
    <ContentStateMessage v-else-if="error" state="error" />
    <ContentList
      v-else-if="data && data.items.length > 0"
      :items="data.items"
      base-path="/articles"
    />
    <ContentStateMessage v-else state="empty" />
  </main>
</template>

<script setup lang="ts">
const content = usePublicContent();
const runtimeConfig = useRuntimeConfig();

const { data, pending, error } = await useAsyncData('articles-list', () => content.listArticles());

const siteName = (runtimeConfig.public?.siteName as string | undefined) ?? 'Dragon';
useHead({ title: `مقالات — ${siteName}` });
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
  gap: var(--space-1);
  margin-bottom: var(--space-10);
}

.content-page__title {
  font-size: var(--text-h1-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h1-tracking);
  margin: 0;
  color: var(--text-primary);
}
</style>
