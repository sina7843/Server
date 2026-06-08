<template>
  <section v-if="posts.length > 0" class="esports-featured" aria-label="مطالب ویژه">
    <div class="esports-featured__header">
      <div class="esports-featured__title-group">
        <span class="dr-label">Featured</span>
        <h2 class="esports-featured__heading">مطالب ویژه</h2>
      </div>
    </div>
    <div class="esports-featured__grid">
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
.esports-featured {
  margin-bottom: var(--space-12);
}

.esports-featured__header {
  margin-bottom: var(--space-6);
}

.esports-featured__title-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-right: var(--space-4);
  border-right: 3px solid var(--purple-500);
  width: fit-content;
}

.esports-featured__heading {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h2-tracking);
  margin: 0;
  color: var(--text-primary);
}

.esports-featured__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .esports-featured__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .esports-featured__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
