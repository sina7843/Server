<template>
  <section v-if="posts.length > 0" class="esports-top" aria-label="محتوای برتر">
    <div class="esports-top__header">
      <div class="esports-top__title-group">
        <span class="dr-label">Top</span>
        <h2 class="esports-top__heading">محتوای برتر</h2>
      </div>
    </div>
    <div class="esports-top__grid">
      <ContentCard
        v-for="post in posts"
        :key="post.id"
        :item="post"
        :base-path="getBasePath(post.type)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PublicPostDto } from '@dragon/types';

defineProps<{
  posts: readonly PublicPostDto[];
}>();

const TYPE_PATHS: Record<string, string> = {
  news: '/news',
  article: '/articles',
  announcement: '/announcements',
  guide: '/guides',
  rule: '/rules',
};

function getBasePath(type: string): string {
  return TYPE_PATHS[type] ?? '/news';
}
</script>

<style scoped>
.esports-top {
  margin-bottom: var(--space-12);
}

.esports-top__header {
  margin-bottom: var(--space-6);
}

.esports-top__title-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-right: var(--space-4);
  border-right: 3px solid rgba(245, 158, 11, 0.7);
  width: fit-content;
}

.esports-top__heading {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h2-tracking);
  margin: 0;
  color: var(--text-primary);
}

.esports-top__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .esports-top__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .esports-top__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
