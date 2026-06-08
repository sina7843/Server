<template>
  <article class="content-card">
    <NuxtLink :to="`${basePath}/${item.slug}`" class="content-card__cover-link" tabindex="-1" aria-hidden="true">
      <div class="content-card__cover" :class="`content-card__cover--${item.type}`">
        <img
          v-if="item.coverImageUrl"
          :src="item.coverImageUrl"
          :alt="item.title"
          class="content-card__cover-img"
        />
        <div class="content-card__cover-glow" />
        <span class="content-card__cover-initial" aria-hidden="true">{{ coverInitial }}</span>
        <span class="content-card__type-pill">{{ typeLabel }}</span>
      </div>
    </NuxtLink>

    <div class="content-card__body">
      <h2 class="content-card__title">
        <NuxtLink :to="`${basePath}/${item.slug}`" class="content-card__link">
          {{ item.title }}
        </NuxtLink>
      </h2>
      <p v-if="item.excerpt" class="content-card__excerpt">{{ item.excerpt }}</p>
      <div class="content-card__footer">
        <time v-if="item.publishedAt" class="content-card__date" :datetime="item.publishedAt">
          {{ formatDate(item.publishedAt) }}
        </time>
        <svg
          class="content-card__arrow"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { PublicPostDto } from '@dragon/sdk';

const props = defineProps<{
  item: PublicPostDto;
  basePath: string;
}>();

const TYPE_LABELS: Record<string, string> = {
  news: 'خبر',
  article: 'مقاله',
  announcement: 'اطلاعیه',
  guide: 'راهنما',
  rule: 'قوانین',
};

const typeLabel = computed(() => TYPE_LABELS[props.item.type] ?? props.item.type);
const coverInitial = computed(() => props.item.title?.[0] ?? '؟');

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
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.14);
  transition:
    border-color var(--motion-base) var(--ease-out),
    box-shadow var(--motion-base) var(--ease-out),
    transform var(--motion-base) var(--ease-out);
}

.content-card:hover {
  border-color: rgba(109, 40, 217, 0.32);
  box-shadow:
    var(--shadow-md),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transform: translateY(-3px);
}

/* ── Cover ── */
.content-card__cover-link {
  display: block;
  text-decoration: none;
}

.content-card__cover {
  position: relative;
  height: 148px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  padding: 12px 14px;
}

.content-card__cover--news {
  background: linear-gradient(145deg, #7c1d1d 0%, #ea580c 100%);
}
.content-card__cover--article {
  background: linear-gradient(145deg, #2d0a65 0%, #a21caf 100%);
}
.content-card__cover--announcement {
  background: linear-gradient(145deg, #1e3a8a 0%, #0369a1 100%);
}
.content-card__cover--guide {
  background: linear-gradient(145deg, #064e3b 0%, #0d9488 100%);
}
.content-card__cover--rule {
  background: linear-gradient(145deg, #1a0540 0%, #6d28d9 100%);
}

.content-card__cover-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.45;
  z-index: 0;
}

.content-card__cover-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 100% at 30% 110%, rgba(255, 255, 255, 0.14), transparent 70%);
  opacity: 0;
  transition: opacity var(--motion-base) var(--ease-out);
  z-index: 1;
}

.content-card:hover .content-card__cover-glow {
  opacity: 1;
}

.content-card__cover-initial {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  font-family: var(--font-display);
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
  color: rgba(255, 255, 255, 0.1);
  pointer-events: none;
  user-select: none;
  transition: color var(--motion-base);
  z-index: 2;
}

.content-card:hover .content-card__cover-initial {
  color: rgba(255, 255, 255, 0.18);
}

.content-card__type-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: rgba(0, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  z-index: 2;
}

/* ── Body ── */
.content-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  flex: 1;
}

.content-card__title {
  font-size: var(--text-h4-size);
  font-weight: var(--weight-semibold);
  margin: 0;
  line-height: var(--text-h4-lh);
  flex: 1;
}

.content-card__link {
  color: var(--text-primary);
  text-decoration: none;
  transition: color var(--motion-fast) var(--ease-out);
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
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.content-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

.content-card__date {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.content-card__arrow {
  color: var(--text-disabled);
  transition:
    color var(--motion-fast),
    transform var(--motion-fast) var(--ease-spring);
}

.content-card:hover .content-card__arrow {
  color: var(--purple-400);
  transform: translateX(-3px);
}
</style>
