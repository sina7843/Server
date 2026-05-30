<template>
  <main class="content-page">
    <div class="content-page__header">
      <span class="dr-label">Latest</span>
      <h1 class="content-page__title">اخبار</h1>
    </div>
    <ContentStateMessage v-if="pending" state="loading" />
    <ContentStateMessage v-else-if="error" state="error" />
    <ContentList v-else-if="data && data.items.length > 0" :items="data.items" base-path="/news" />
    <ContentStateMessage v-else state="empty" />
  </main>
</template>

<script setup lang="ts">
const content = usePublicContent();

const { data, pending, error } = await useAsyncData('news-list', () => content.listNews());

useHead({ title: 'اخبار — Dragon' });
</script>

<style scoped>
.content-page {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.content-page__header {
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content-page__title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h2-tracking);
  margin: 0;
  color: var(--text-primary);
}
</style>
