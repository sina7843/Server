<template>
  <article class="content-card">
    <h2 class="content-card__title">
      <NuxtLink :to="`${basePath}/${item.slug}`" class="content-card__link">
        {{ item.title }}
      </NuxtLink>
    </h2>
    <p v-if="item.excerpt" class="content-card__excerpt">{{ item.excerpt }}</p>
    <time v-if="item.publishedAt" class="content-card__date" :datetime="item.publishedAt">
      {{ formatDate(item.publishedAt) }}
    </time>
  </article>
</template>

<script setup lang="ts">
import type { PublicPostDto } from '@dragon/sdk';

defineProps<{
  item: PublicPostDto;
  basePath: string;
}>();

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}
</script>

<style scoped>
.content-card {
  border-bottom: 1px solid #e2e8f0;
  padding: 1.25rem 0;
}

.content-card:last-child {
  border-bottom: none;
}

.content-card__title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.4rem;
}

.content-card__link {
  color: #1e293b;
  text-decoration: none;
}

.content-card__link:hover {
  color: #2563eb;
}

.content-card__excerpt {
  color: #475569;
  font-size: 0.9rem;
  margin: 0 0 0.4rem;
  line-height: 1.6;
}

.content-card__date {
  font-size: 0.8rem;
  color: #94a3b8;
}
</style>
