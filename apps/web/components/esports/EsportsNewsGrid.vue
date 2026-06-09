<template>
  <section ref="containerRef" class="esports-news" aria-label="آخرین اخبار">
    <div class="esports-news__header" data-sr>
      <div class="esports-news__title-group">
        <span class="dr-label">Latest</span>
        <h2 class="esports-news__heading">آخرین اخبار</h2>
      </div>
      <NuxtLink to="/news" class="esports-news__all-link">
        همه اخبار
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </NuxtLink>
    </div>

    <template v-if="posts.length > 0">
      <div class="esports-news__grid">
        <!-- Featured: large card on the dominant side -->
        <div class="esports-news__featured" data-sr>
          <ContentCard :item="posts[0]" base-path="/news" />
        </div>

        <!-- Side: compact editorial list items -->
        <div class="esports-news__side" data-sr>
          <NuxtLink
            v-for="post in posts.slice(1, 5)"
            :key="post.id"
            :to="`/news/${post.slug}`"
            class="news-item"
          >
            <div class="news-item__cover" :class="`news-item__cover--${post.type}`">
              <img
                v-if="post.coverImageUrl"
                :src="post.coverImageUrl"
                :alt="post.title"
                class="news-item__img"
              />
              <span class="news-item__initial" aria-hidden="true">{{ post.title?.[0] ?? '؟' }}</span>
            </div>
            <div class="news-item__body">
              <span class="news-item__type">{{ getTypeLabel(post.type) }}</span>
              <p class="news-item__title">{{ post.title }}</p>
              <time class="news-item__date" :datetime="post.publishedAt">
                {{ formatDate(post.publishedAt) }}
              </time>
            </div>
          </NuxtLink>
        </div>
      </div>

      <div class="esports-news__more">
        <NuxtLink to="/news" class="dr-btn dr-btn-secondary">مشاهده همه اخبار</NuxtLink>
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

const { containerRef } = useScrollReveal({ staggerMs: 100 });

const TYPE_LABELS: Record<string, string> = {
  news: 'خبر',
  article: 'مقاله',
  announcement: 'اطلاعیه',
  guide: 'راهنما',
  rule: 'قوانین',
};

function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}
</script>

<style scoped>
.esports-news {
  margin-bottom: var(--space-12);
}

/* ── Section header ── */
.esports-news__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
}

.esports-news__title-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-right: var(--space-4);
  border-right: 3px solid var(--purple-500);
}

.esports-news__heading {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h2-tracking);
  margin: 0;
  color: var(--text-primary);
}

.esports-news__all-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13px;
  flex-shrink: 0;
  transition: color var(--motion-fast);
}

.esports-news__all-link:hover {
  color: var(--purple-300);
}

/* ── Grid ── */
.esports-news__grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr;
}

.esports-news__featured :deep(.content-card__cover) {
  height: 200px;
}

/* ── Compact side list ── */
.esports-news__side {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface-card);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
}

.news-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  text-decoration: none;
  border-bottom: 1px solid var(--border-subtle);
  transition: background var(--motion-fast) var(--ease-out);
}

.news-item:last-child {
  border-bottom: none;
}

.news-item:hover {
  background: var(--surface-elevated);
}

.news-item__cover {
  position: relative;
  flex-shrink: 0;
  width: 68px;
  height: 68px;
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.news-item__cover--news     { background: linear-gradient(135deg, #7c1d1d, #f97316); }
.news-item__cover--article  { background: linear-gradient(135deg, #2e0a66, #d946ef); }
.news-item__cover--announcement { background: linear-gradient(135deg, #1e3a8a, #06b6d4); }
.news-item__cover--guide    { background: linear-gradient(135deg, #064e3b, #34d399); }
.news-item__cover--rule     { background: linear-gradient(135deg, #1a0540, #9869ff); }

.news-item__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  opacity: 0.55;
}

.news-item__initial {
  font-size: 26px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.22);
  font-family: var(--font-display);
  line-height: 1;
  position: relative;
  z-index: 1;
  pointer-events: none;
  user-select: none;
}

.news-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.news-item__type {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--purple-400);
  text-transform: uppercase;
}

.news-item__title {
  margin: 0;
  font-size: var(--text-body-sm-size);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--motion-fast);
}

.news-item:hover .news-item__title {
  color: var(--purple-300);
}

.news-item__date {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* ── More button ── */
.esports-news__more {
  margin-top: var(--space-6);
  display: flex;
  justify-content: center;
}

@media (min-width: 768px) {
  .esports-news__grid {
    grid-template-columns: 1.35fr 1fr;
    align-items: start;
  }

  .esports-news__featured :deep(.content-card__cover) {
    height: 280px;
  }

  .esports-news__featured :deep(.content-card) {
    height: 100%;
  }
}
</style>
