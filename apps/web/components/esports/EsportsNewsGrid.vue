<template>
  <section class="esports-news" aria-label="آخرین اخبار">
    <div class="esports-news__header">
      <span class="dr-label">Latest</span>
      <h2 class="esports-news__heading">آخرین اخبار</h2>
    </div>
    <template v-if="posts.length > 0">
      <div class="esports-news__grid">
        <ContentCard v-for="post in posts" :key="post.id" :item="post" base-path="/news" />
      </div>
      <div class="esports-news__more">
        <NuxtLink to="/news" class="dr-btn dr-btn-secondary">همه اخبار</NuxtLink>
      </div>
    </template>
    <ContentStateMessage v-else state="empty" />
  </section>
</template>

<script setup lang="ts">
import type { PublicPostDto } from '@dragon/types';

defineProps<{
  posts: readonly PublicPostDto[];
}>();
</script>

<style scoped>
.esports-news {
  margin-bottom: var(--space-12);
}

.esports-news__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-6);
}

.esports-news__heading {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h2-tracking);
  margin: 0;
  color: var(--text-primary);
}

.esports-news__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.esports-news__more {
  margin-top: var(--space-6);
  display: flex;
  justify-content: center;
}

@media (min-width: 640px) {
  .esports-news__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .esports-news__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
