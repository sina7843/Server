<template>
  <aside class="crs">
    <!-- Taxonomy panel -->
    <div v-if="categories.length || tags.length" class="crs__panel">
      <div v-if="categories.length" class="crs__group">
        <span class="crs__group-label">دسته‌بندی‌ها</span>
        <div class="crs__chips">
          <NuxtLink
            v-for="cat in categories"
            :key="cat.id"
            :to="`/categories/${cat.slug}`"
            class="crs__chip crs__chip--cat"
          >{{ cat.name }}</NuxtLink>
        </div>
      </div>
      <div v-if="tags.length" class="crs__group">
        <span class="crs__group-label">برچسب‌ها</span>
        <div class="crs__chips">
          <NuxtLink
            v-for="tag in tags"
            :key="tag.id"
            :to="`/tags/${tag.slug}`"
            class="crs__chip crs__chip--tag"
          >#{{ tag.name }}</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Related posts panel -->
    <div v-if="relatedPosts.length" class="crs__panel">
      <h3 class="crs__panel-title">مطالب مرتبط</h3>
      <ul class="crs__list">
        <li v-for="item in relatedPosts" :key="item.slug">
          <NuxtLink :to="`${baseRoute}/${item.slug}`" class="crs__card">
            <div class="crs__thumb" :class="`crs__thumb--${item.type}`">
              <img
                v-if="item.coverImageUrl"
                :src="item.coverImageUrl"
                :alt="item.title"
                loading="lazy"
              />
              <span v-else class="crs__thumb-glyph" aria-hidden="true">◈</span>
            </div>
            <div class="crs__card-body">
              <p class="crs__card-title">{{ item.title }}</p>
              <time v-if="item.publishedAt" class="crs__card-date">
                {{ formatDate(item.publishedAt) }}
              </time>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { PublicPostDto, PublicCategoryDto, PublicTagDto } from '@dragon/sdk';

defineProps<{
  categories: readonly PublicCategoryDto[];
  tags: readonly PublicTagDto[];
  relatedPosts: readonly PublicPostDto[];
  baseRoute: string;
}>();

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}
</script>

<style scoped>
.crs {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  position: sticky;
  top: calc(var(--layout-topbar-h) + var(--space-6));
}

/* Panel card */
.crs__panel {
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Taxonomy group */
.crs__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.crs__group-label {
  font-size: var(--text-label-size);
  font-weight: 700;
  letter-spacing: var(--text-label-tracking);
  text-transform: uppercase;
  color: var(--text-muted);
}

.crs__panel-title {
  font-size: var(--text-body-sm-size);
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0 0 var(--space-1);
}

/* Chips */
.crs__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.crs__chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: var(--text-caption-size);
  font-weight: 500;
  text-decoration: none;
  transition: background var(--motion-fast), color var(--motion-fast);
}

.crs__chip--cat {
  background: rgba(109, 40, 217, 0.12);
  color: var(--purple-300);
  border: 1px solid rgba(192, 132, 252, 0.2);
}

.crs__chip--cat:hover {
  background: rgba(109, 40, 217, 0.22);
}

.crs__chip--tag {
  background: var(--surface-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--glass-border-strong);
}

.crs__chip--tag:hover {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
}

/* Related list */
.crs__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.crs__card {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background var(--motion-fast);
}

.crs__card:hover {
  background: var(--hover-overlay);
}

/* Thumbnail */
.crs__thumb {
  flex-shrink: 0;
  width: 68px;
  height: 52px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crs__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.crs__thumb-glyph {
  font-size: 18px;
  opacity: 0.4;
  color: #fff;
}

.crs__thumb--news        { background: linear-gradient(135deg, #7c1d1d, #f97316); }
.crs__thumb--article     { background: linear-gradient(135deg, #2e0a66, #d946ef); }
.crs__thumb--announcement{ background: linear-gradient(135deg, #1e3a8a, #06b6d4); }
.crs__thumb--guide       { background: linear-gradient(135deg, #064e3b, #34d399); }
.crs__thumb--rule        { background: linear-gradient(135deg, #1a0540, #9869ff); }

/* Card body */
.crs__card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.crs__card-title {
  font-size: var(--text-caption-size);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
  transition: color var(--motion-fast);
}

.crs__card:hover .crs__card-title {
  color: var(--purple-300);
}

.crs__card-date {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  display: block;
}
</style>
