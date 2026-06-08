<template>
  <section class="esports-hero" aria-label="سرخط خبری">
    <div class="esports-hero__card" :class="`esports-hero__card--${post.type}`">
      <!-- Cover image, shown when available -->
      <img
        v-if="post.coverImageUrl"
        :src="post.coverImageUrl"
        :alt="post.title"
        class="esports-hero__cover-img"
      />
      <!-- Type-colored gradient base -->
      <div class="esports-hero__bg" aria-hidden="true" />
      <!-- Bottom-to-top darkness for text legibility -->
      <div class="esports-hero__overlay" aria-hidden="true" />
      <!-- Ambient glow orbs -->
      <div class="esports-hero__orb esports-hero__orb--1" aria-hidden="true" />
      <div class="esports-hero__orb esports-hero__orb--2" aria-hidden="true" />

      <div class="esports-hero__content">
        <div class="esports-hero__meta">
          <span class="esports-hero__type-badge">{{ typeLabel }}</span>
          <template v-if="post.authorName">
            <span class="esports-hero__sep" aria-hidden="true">·</span>
            <span class="esports-hero__author">{{ post.authorName }}</span>
          </template>
          <span class="esports-hero__sep" aria-hidden="true">·</span>
          <time class="esports-hero__date" :datetime="post.publishedAt">
            {{ formatDate(post.publishedAt) }}
          </time>
          <template v-if="post.viewCount">
            <span class="esports-hero__sep" aria-hidden="true">·</span>
            <span class="esports-hero__views">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {{ formatViewCount(post.viewCount) }}
            </span>
          </template>
        </div>

        <h1 class="esports-hero__title">
          <NuxtLink :to="postPath" class="esports-hero__link">
            {{ post.title }}
          </NuxtLink>
        </h1>

        <p v-if="post.excerpt" class="esports-hero__excerpt">{{ post.excerpt }}</p>

        <div class="esports-hero__actions">
          <NuxtLink :to="postPath" class="esports-hero__cta dr-btn dr-btn-primary dr-btn-lg">
            ادامه مطلب
            <svg
              width="16"
              height="16"
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
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PublicPostDto } from '@dragon/types';

const props = defineProps<{
  post: PublicPostDto;
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
  const base = TYPE_PATHS[props.post.type] ?? '/news';
  return `${base}/${props.post.slug}`;
});

const typeLabel = computed(() => TYPE_LABELS[props.post.type] ?? props.post.type);

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
.esports-hero {
  margin-bottom: var(--space-12);
}

.esports-hero__card {
  position: relative;
  border-radius: var(--radius-2xl);
  padding: var(--space-10) var(--space-8);
  min-height: 380px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  border: 1px solid var(--glass-border-strong);
  box-shadow: var(--shadow-lg);
}

/* ── Layer order: bg(z0) → cover-img(z1) → overlay+orbs(z2) → content(z3) ── */

.esports-hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.esports-hero__card--news .esports-hero__bg {
  background: linear-gradient(145deg, #1a0505 0%, #7c1d1d 40%, #c2410c 100%);
}
.esports-hero__card--article .esports-hero__bg {
  background: linear-gradient(145deg, #0f0520 0%, #2e0a66 45%, #9333ea 100%);
}
.esports-hero__card--announcement .esports-hero__bg {
  background: linear-gradient(145deg, #050d1a 0%, #1e3a8a 45%, #1d4ed8 100%);
}
.esports-hero__card--guide .esports-hero__bg {
  background: linear-gradient(145deg, #011a0f 0%, #064e3b 45%, #0d9488 100%);
}
.esports-hero__card--rule .esports-hero__bg {
  background: linear-gradient(145deg, #0d0220 0%, #1a0540 45%, #5b21b6 100%);
}

.esports-hero__cover-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.3;
  z-index: 1;
}

.esports-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(5, 2, 15, 0.96) 0%,
    rgba(5, 2, 15, 0.72) 40%,
    rgba(5, 2, 15, 0.28) 70%,
    transparent 100%
  );
  z-index: 2;
}

.esports-hero__orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(48px);
  z-index: 2;
}

.esports-hero__orb--1 {
  width: 380px;
  height: 380px;
  top: -100px;
  right: -60px;
  background: radial-gradient(circle, rgba(109, 40, 217, 0.32) 0%, transparent 70%);
  animation: orb-drift-1 12s ease-in-out infinite alternate;
}

.esports-hero__orb--2 {
  width: 280px;
  height: 280px;
  bottom: -90px;
  left: -50px;
  background: radial-gradient(circle, rgba(192, 38, 211, 0.18) 0%, transparent 70%);
  animation: orb-drift-2 15s ease-in-out infinite alternate;
}

@keyframes orb-drift-1 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(30px, 20px) scale(1.1); }
}
@keyframes orb-drift-2 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(-20px, -30px) scale(1.08); }
}

.esports-hero__content {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}

/* ── Meta row ── */
.esports-hero__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.esports-hero__type-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, rgba(109, 40, 217, 0.3), rgba(192, 38, 211, 0.16));
  border: 1px solid rgba(167, 109, 252, 0.35);
  color: var(--magenta-300);
}

.esports-hero__sep {
  color: var(--text-disabled);
  font-size: 12px;
  line-height: 1;
}

.esports-hero__author {
  font-size: var(--text-caption-size);
  color: var(--text-secondary);
  font-weight: 500;
}

.esports-hero__date {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.esports-hero__views {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* ── Title ── */
.esports-hero__title {
  font-size: var(--text-h1-size);
  font-weight: var(--weight-bold);
  line-height: var(--text-h1-lh);
  letter-spacing: var(--text-h1-tracking);
  margin: 0;
}

.esports-hero__link {
  color: var(--text-primary);
  text-decoration: none;
  transition: color var(--motion-fast) var(--ease-out);
}

.esports-hero__link:hover {
  color: var(--purple-200);
}

.esports-hero__excerpt {
  color: var(--text-secondary);
  font-size: var(--text-body-size);
  line-height: var(--text-body-lh);
  margin: 0;
  max-width: 60ch;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.esports-hero__cta {
  align-self: flex-start;
  gap: 8px;
}

@media (min-width: 768px) {
  .esports-hero__card {
    padding: var(--space-16) var(--space-12);
    min-height: 500px;
  }

  .esports-hero__title {
    font-size: var(--text-hero-size);
    line-height: var(--text-hero-lh);
    letter-spacing: var(--text-hero-tracking);
    max-width: 18ch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .esports-hero__orb { animation: none; }
}
</style>
