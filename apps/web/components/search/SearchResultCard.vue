<template>
  <article class="search-result-card">
    <div class="search-result-card__meta">
      <span class="search-result-card__type">{{ TYPE_LABELS[item.type] ?? item.type }}</span>
    </div>
    <h2 class="search-result-card__title">
      <NuxtLink :to="resolvedRoute" class="search-result-card__link">
        {{ item.title }}
      </NuxtLink>
    </h2>
    <p v-if="item.excerpt" class="search-result-card__excerpt">{{ item.excerpt }}</p>
    <time v-if="item.createdAt" class="search-result-card__date" :datetime="item.createdAt">
      {{ formatDate(item.createdAt) }}
    </time>
  </article>
</template>

<script setup lang="ts">
import type { SearchResultItemDto } from '@dragon/types';

const props = defineProps<{
  item: SearchResultItemDto;
}>();

const TYPE_LABELS: Record<string, string> = {
  news: 'خبر',
  article: 'مقاله',
  announcement: 'اعلان',
  guide: 'راهنما',
  rule: 'قانون',
  page: 'صفحه',
};

const ROUTE_BASES: Record<string, string> = {
  news: '/news',
  article: '/articles',
  announcement: '/announcements',
  guide: '/guides',
  rule: '/rules',
  page: '/pages',
};

const resolvedRoute = computed(() => {
  if (props.item.route) return props.item.route;
  const base = ROUTE_BASES[props.item.type] ?? '/content';
  return props.item.slug ? `${base}/${props.item.slug}` : '#';
});

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
</script>

<style scoped>
.search-result-card {
  border-bottom: 1px solid var(--glass-hairline);
  padding: 1.25rem 0;
}

.search-result-card:last-child {
  border-bottom: none;
}

.search-result-card__meta {
  margin-block-end: 0.35rem;
}

.search-result-card__type {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  background: rgba(109, 40, 217, 0.15);
  color: var(--purple-300);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.search-result-card__title {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 0.4rem;
}

.search-result-card__link {
  color: var(--text-primary);
  text-decoration: none;
}

.search-result-card__link:hover {
  color: var(--purple-300);
}

.search-result-card__excerpt {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 0.4rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.search-result-card__date {
  font-size: 0.8rem;
  color: var(--text-muted);
}
</style>
