<template>
  <article class="content-card dr-card">
    <div v-if="item.category" class="content-card__cat">{{ item.category }}</div>
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
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition:
    border-color 160ms var(--ease-out),
    box-shadow 160ms var(--ease-out);
}

.content-card:hover {
  border-color: var(--glass-border-strong);
  box-shadow:
    var(--shadow-sm),
    inset 0 1px 0 var(--glass-inset-highlight);
}

.content-card__cat {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--purple-400);
  font-family: var(--font-sans-en);
}

.content-card__title {
  font-size: var(--text-h4-size);
  font-weight: var(--weight-semibold);
  margin: 0;
  line-height: var(--text-h4-lh);
}

.content-card__link {
  color: var(--text-primary);
  text-decoration: none;
  transition: color 120ms var(--ease-out);
}
.content-card__link:hover {
  color: var(--purple-300);
}

.content-card__excerpt {
  color: var(--text-secondary);
  font-size: var(--text-body-sm-size);
  margin: 0;
  line-height: var(--text-body-sm-lh);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.content-card__date {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-mono);
}
</style>
