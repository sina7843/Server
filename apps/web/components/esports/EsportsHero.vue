<template>
  <section class="esports-hero" aria-label="سرخط خبری">
    <template v-if="post">
      <div class="esports-hero__inner dr-card dr-card-brand">
        <div class="esports-hero__meta">
          <span class="dr-badge">{{ typeLabel }}</span>
          <time class="esports-hero__date" :datetime="post.publishedAt">
            {{ formatDate(post.publishedAt) }}
          </time>
        </div>
        <h1 class="esports-hero__title">
          <NuxtLink :to="postPath" class="esports-hero__link">
            {{ post.title }}
          </NuxtLink>
        </h1>
        <p v-if="post.excerpt" class="esports-hero__excerpt">{{ post.excerpt }}</p>
        <NuxtLink :to="postPath" class="dr-btn dr-btn-primary esports-hero__cta">
          ادامه مطلب
        </NuxtLink>
      </div>
    </template>
    <template v-else>
      <div class="esports-hero__empty">
        <p class="esports-hero__empty-msg">
          به درگون خوش آمدید — محتوای ویژه به زودی اضافه می‌شود.
        </p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { PublicPostDto } from '@dragon/types';

const props = defineProps<{
  post?: PublicPostDto;
}>();

const TYPE_PATHS: Record<string, string> = {
  news: '/news',
  article: '/articles',
  announcement: '/announcements',
  guide: '/guides',
  rule: '/rules',
};

const TYPE_LABELS: Record<string, string> = {
  news: 'خبر',
  article: 'مقاله',
  announcement: 'اطلاعیه',
  guide: 'راهنما',
  rule: 'قوانین',
};

const postPath = computed(() => {
  if (!props.post) return '/';
  const base = TYPE_PATHS[props.post.type] ?? '/news';
  return `${base}/${props.post.slug}`;
});

const typeLabel = computed(() => {
  if (!props.post) return '';
  return TYPE_LABELS[props.post.type] ?? props.post.type;
});

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}
</script>

<style scoped>
.esports-hero {
  margin-bottom: var(--space-12);
}

.esports-hero__inner {
  padding: var(--space-10) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 280px;
  justify-content: flex-end;
}

.esports-hero__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.esports-hero__date {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.esports-hero__title {
  font-size: var(--text-h1-size);
  font-weight: var(--weight-bold);
  line-height: var(--text-h1-lh);
  margin: 0;
}

.esports-hero__link {
  color: var(--text-primary);
  text-decoration: none;
  transition: color 120ms var(--ease-out);
}

.esports-hero__link:hover {
  color: var(--purple-300);
}

.esports-hero__excerpt {
  color: var(--text-secondary);
  font-size: var(--text-body-size);
  line-height: var(--text-body-lh);
  margin: 0;
  max-width: 64ch;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.esports-hero__cta {
  align-self: flex-start;
}

.esports-hero__empty {
  padding: var(--space-12) var(--space-6);
  text-align: center;
}

.esports-hero__empty-msg {
  color: var(--text-muted);
  font-size: var(--text-body-size);
  margin: 0;
}

@media (min-width: 768px) {
  .esports-hero__inner {
    padding: var(--space-14) var(--space-12);
    min-height: 360px;
  }

  .esports-hero__title {
    font-size: var(--text-display-size);
    line-height: var(--text-display-lh);
  }
}
</style>
