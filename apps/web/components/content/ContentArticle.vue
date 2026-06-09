<template>
  <article class="content-article">

    <!-- Back navigation -->
    <NuxtLink :to="backRoute" class="content-article__back">
      <span aria-hidden="true">←</span>
      {{ backLabel }}
    </NuxtLink>

    <!-- Hero card -->
    <header
      class="content-article__hero"
      :class="[`content-article__hero--${post.type}`, post.coverImageUrl ? 'content-article__hero--has-image' : '']"
    >
      <!-- Real cover image (when available) -->
      <img
        v-if="post.coverImageUrl"
        :src="post.coverImageUrl"
        :alt="post.title"
        class="content-article__hero-img"
      />
      <!-- Color tint -->
      <div class="content-article__hero-tint" aria-hidden="true" />

      <div class="content-article__meta">
        <span class="content-article__type-pill">{{ typeLabel }}</span>
        <template v-if="post.authorName">
          <span class="content-article__meta-sep" aria-hidden="true">·</span>
          <span class="content-article__author">{{ post.authorName }}</span>
        </template>
        <span class="content-article__meta-sep" aria-hidden="true">·</span>
        <time
          v-if="post.publishedAt"
          class="content-article__date"
          :datetime="post.publishedAt"
        >
          {{ formatDate(post.publishedAt) }}
        </time>
        <template v-if="readingTime > 0">
          <span class="content-article__meta-sep" aria-hidden="true">·</span>
          <span class="content-article__reading-time">{{ readingTime }} دقیقه مطالعه</span>
        </template>
      </div>

      <h1 class="content-article__title">{{ post.title }}</h1>

      <p v-if="post.excerpt" class="content-article__excerpt">{{ post.excerpt }}</p>

      <!-- Stats bar -->
      <div v-if="post.viewCount" class="content-article__stats">
        <span class="content-article__stat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          {{ formatViewCount(post.viewCount) }} بازدید
        </span>
      </div>
    </header>

    <!-- Body -->
    <div class="content-article__body-wrap">
      <ContentHtmlRenderer :html="post.bodyHtml" class="content-article__body" />
    </div>

    <!-- Taxonomy footer -->
    <footer
      v-if="!hideTaxonomy && (resolvedCategories.length || resolvedTags.length)"
      class="content-article__taxonomy"
    >
      <div v-if="resolvedCategories.length" class="content-article__taxonomy-group">
        <span class="content-article__taxonomy-label">دسته‌بندی‌ها</span>
        <div class="content-article__chips">
          <NuxtLink
            v-for="cat in resolvedCategories"
            :key="cat.id"
            :to="`/categories/${cat.slug}`"
            class="content-article__chip content-article__chip--category"
          >
            {{ cat.name }}
          </NuxtLink>
        </div>
      </div>
      <div v-if="resolvedTags.length" class="content-article__taxonomy-group">
        <span class="content-article__taxonomy-label">برچسب‌ها</span>
        <div class="content-article__chips">
          <NuxtLink
            v-for="tag in resolvedTags"
            :key="tag.id"
            :to="`/tags/${tag.slug}`"
            class="content-article__chip content-article__chip--tag"
          >
            #{{ tag.name }}
          </NuxtLink>
        </div>
      </div>
    </footer>

  </article>
</template>

<script setup lang="ts">
import type { PublicPostDto, PublicCategoryDto, PublicTagDto } from '@dragon/sdk';

const props = defineProps<{
  post: PublicPostDto;
  categories?: readonly PublicCategoryDto[];
  tags?: readonly PublicTagDto[];
  hideTaxonomy?: boolean;
}>();

const TYPE_LABELS: Record<string, string> = {
  news: 'خبر',
  article: 'مقاله',
  announcement: 'اطلاعیه',
  guide: 'راهنما',
  rule: 'قوانین',
};

const TYPE_ROUTES: Record<string, string> = {
  news: '/news',
  article: '/articles',
  announcement: '/announcements',
  guide: '/guides',
  rule: '/rules',
};

const TYPE_BACK_LABELS: Record<string, string> = {
  news: 'بازگشت به اخبار',
  article: 'بازگشت به مقالات',
  announcement: 'بازگشت به اطلاعیه‌ها',
  guide: 'بازگشت به راهنماها',
  rule: 'بازگشت به قوانین',
};

const typeLabel = computed(() => TYPE_LABELS[props.post.type] ?? props.post.type);
const backRoute = computed(() => TYPE_ROUTES[props.post.type] ?? '/');
const backLabel = computed(() => TYPE_BACK_LABELS[props.post.type] ?? 'بازگشت');

const resolvedCategories = computed(() => props.categories ?? []);
const resolvedTags = computed(() => props.tags ?? []);

const readingTime = computed(() => {
  const text = props.post.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(' ').filter(Boolean).length;
  return words < 30 ? 0 : Math.max(1, Math.round(words / 180));
});

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
</script>

<style scoped>
.content-article {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* ── Back link ─────────────────────────────────────────── */
.content-article__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
  text-decoration: none;
  font-size: var(--text-body-sm-size);
  transition: color 0.15s;
  width: fit-content;
}

.content-article__back:hover {
  color: var(--text-primary);
}

/* ── Hero card ─────────────────────────────────────────── */
.content-article__hero {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--glass-border);
  background: var(--surface-card);
  backdrop-filter: blur(12px);
  padding: var(--space-10) var(--space-10) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Top accent bar */
.content-article__hero::before {
  content: '';
  position: absolute;
  top: 0;
  inset-inline: 0;
  height: 4px;
  z-index: 2;
}

/* Real cover image */
.content-article__hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  opacity: 0.25;
  z-index: 0;
}

/* Tint overlay */
.content-article__hero-tint {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.07;
}

/* When image is present, strengthen the tint so text stays readable */
.content-article__hero--has-image .content-article__hero-tint {
  opacity: 0.35;
  background: linear-gradient(160deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%) !important;
}

/* All hero content above overlays */
.content-article__hero > *:not(.content-article__hero-img):not(.content-article__hero-tint) {
  position: relative;
  z-index: 3;
}

/* ── Type variants ────────────────────────────────────── */
.content-article__hero--news::before {
  background: linear-gradient(90deg, #7c1d1d, #f97316);
}
.content-article__hero--news .content-article__hero-tint {
  background: radial-gradient(ellipse at top left, #f97316 0%, transparent 65%);
}

.content-article__hero--article::before {
  background: linear-gradient(90deg, #2e0a66, #d946ef);
}
.content-article__hero--article .content-article__hero-tint {
  background: radial-gradient(ellipse at top left, #d946ef 0%, transparent 65%);
}

.content-article__hero--announcement::before {
  background: linear-gradient(90deg, #1e3a8a, #06b6d4);
}
.content-article__hero--announcement .content-article__hero-tint {
  background: radial-gradient(ellipse at top left, #06b6d4 0%, transparent 65%);
}

.content-article__hero--guide::before {
  background: linear-gradient(90deg, #064e3b, #34d399);
}
.content-article__hero--guide .content-article__hero-tint {
  background: radial-gradient(ellipse at top left, #34d399 0%, transparent 65%);
}

.content-article__hero--rule::before {
  background: linear-gradient(90deg, #1a0540, #9869ff);
}
.content-article__hero--rule .content-article__hero-tint {
  background: radial-gradient(ellipse at top left, #9869ff 0%, transparent 65%);
}

/* ── Meta row ─────────────────────────────────────────── */
.content-article__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}

.content-article__type-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: rgba(109, 40, 217, 0.15);
  border: 1px solid rgba(192, 132, 252, 0.3);
  color: var(--purple-300);
}

.content-article__meta-sep {
  color: var(--text-disabled);
  font-size: 12px;
  line-height: 1;
}

.content-article__author {
  font-size: var(--text-caption-size);
  font-weight: 600;
  color: var(--text-secondary);
}

.content-article__date,
.content-article__reading-time {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* ── Title & excerpt ──────────────────────────────────── */
.content-article__title {
  font-size: clamp(28px, 4vw, var(--text-h1-size));
  font-weight: var(--weight-bold);
  line-height: var(--text-h1-lh);
  letter-spacing: var(--text-h1-tracking);
  margin: 0 0 var(--space-4);
  color: var(--text-primary);
}

.content-article__excerpt {
  font-size: var(--text-body-lg-size);
  line-height: var(--text-body-lg-lh);
  color: var(--text-secondary);
  margin: 0 0 var(--space-6);
  max-width: 64ch;
}

/* ── Stats bar ────────────────────────────────────────── */
.content-article__stats {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--glass-hairline);
}

.content-article__stat {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* ── Body ─────────────────────────────────────────────── */
.content-article__body-wrap {
  padding: var(--space-4) 0 var(--space-6);
}

.content-article__body {
  max-width: var(--layout-prose-max);
  margin: 0 auto;
  font-size: var(--text-body-size);
  line-height: var(--text-body-lh);
}

/* ── Taxonomy footer ──────────────────────────────────── */
.content-article__taxonomy {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--surface-elevated);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.content-article__taxonomy-group {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.content-article__taxonomy-label {
  font-size: var(--text-label-size);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  white-space: nowrap;
  padding-top: 4px;
  min-width: 80px;
}

.content-article__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.content-article__chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: var(--text-caption-size);
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.content-article__chip--category {
  background: rgba(109, 40, 217, 0.12);
  color: var(--purple-300);
  border: 1px solid rgba(192, 132, 252, 0.2);
}

.content-article__chip--category:hover {
  background: rgba(109, 40, 217, 0.22);
}

.content-article__chip--tag {
  background: var(--surface-card);
  color: var(--text-secondary);
  border: 1px solid var(--glass-border-strong);
}

.content-article__chip--tag:hover {
  background: var(--surface-elevated);
  color: var(--text-primary);
}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 640px) {
  .content-article__hero {
    padding: var(--space-6) var(--space-6) var(--space-6);
  }

  .content-article__taxonomy {
    padding: var(--space-4);
  }

  .content-article__taxonomy-group {
    flex-direction: column;
    gap: var(--space-2);
  }
}
</style>
