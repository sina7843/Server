<template>
  <article class="content-article">
    <header class="content-article__header">
      <h1 class="content-article__title">{{ post.title }}</h1>
      <p v-if="post.excerpt" class="content-article__excerpt">{{ post.excerpt }}</p>
      <time v-if="post.publishedAt" class="content-article__date" :datetime="post.publishedAt">
        {{ formatDate(post.publishedAt) }}
      </time>
    </header>
    <ContentHtmlRenderer :html="post.bodyHtml" class="content-article__body" />
  </article>
</template>

<script setup lang="ts">
import type { PublicPostDto } from '@dragon/sdk';

defineProps<{
  post: PublicPostDto;
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
.content-article {
  max-width: 72ch;
}

.content-article__header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.content-article__title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 0.5rem;
  color: #1e293b;
}

.content-article__excerpt {
  color: #475569;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 0.75rem;
}

.content-article__date {
  font-size: 0.85rem;
  color: #94a3b8;
}

.content-article__body {
  font-size: 1rem;
  line-height: 1.8;
  color: #1e293b;
}
</style>
