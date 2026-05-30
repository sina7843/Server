<template>
  <section v-if="posts.length > 0" class="esports-featured" aria-label="مطالب ویژه">
    <h2 class="esports-featured__heading t-h3">مطالب ویژه</h2>
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

.esports-featured__heading {
  margin: 0 0 var(--space-6) 0;
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
