<template>
  <main class="content-page">
    <ContentStateMessage v-if="pending" state="loading" />
    <ContentStateMessage v-else-if="error" state="error" />
    <ContentStateMessage v-else-if="!post" state="not-found" />
    <div v-else class="content-page__grid">
      <div class="content-page__main">
        <ContentArticle
          :post="post"
          :categories="resolvedCategories"
          :tags="resolvedTags"
          :hide-taxonomy="true"
        />
      </div>
      <ContentRelatedSidebar
        :categories="resolvedCategories"
        :tags="resolvedTags"
        :related-posts="relatedPosts"
        base-route="/announcements"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import { buildContentSeoHead } from '../../features/content/content-seo';

const route = useRoute();
const slug = route.params.slug as string;
const content = usePublicContent();

const { data, pending, error } = await useAsyncData(`announcement-${slug}`, async () => {
  try {
    const [postResult, catsResult, tagsResult, recentResult] = await Promise.allSettled([
      content.getAnnouncement(slug),
      content.listCategories(),
      content.listTags(),
      content.listAnnouncements({ limit: 10 }),
    ]);

    if (postResult.status === 'rejected') {
      const msg = postResult.reason instanceof Error ? postResult.reason.message : '';
      if (msg.includes('404')) return null;
      throw postResult.reason;
    }

    return {
      post: postResult.value.post,
      categories: catsResult.status === 'fulfilled' ? catsResult.value.items : [],
      tags: tagsResult.status === 'fulfilled' ? tagsResult.value.items : [],
      recentPosts: recentResult.status === 'fulfilled' ? recentResult.value.items : [],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('404')) return null;
    throw err;
  }
});

const post = computed(() => data.value?.post ?? null);
const isAbsent = computed(() => !pending.value && !post.value);

const resolvedCategories = computed(() => {
  if (!post.value || !data.value?.categories?.length) return [];
  const ids = new Set(post.value.categoryIds);
  return data.value.categories.filter((c) => ids.has(c.id));
});

const resolvedTags = computed(() => {
  if (!post.value || !data.value?.tags?.length) return [];
  const ids = new Set(post.value.tagIds);
  return data.value.tags.filter((t) => ids.has(t.id));
});

const relatedPosts = computed(() => {
  if (!post.value || !data.value?.recentPosts?.length) return [];
  const current = post.value;
  const catIds = new Set(current.categoryIds);
  const tagIds = new Set(current.tagIds);
  return data.value.recentPosts
    .filter((p) => p.slug !== current.slug)
    .map((p) => ({
      p,
      score:
        p.categoryIds.filter((id) => catIds.has(id)).length * 2 +
        p.tagIds.filter((id) => tagIds.has(id)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ p }) => p);
});

useHead(
  computed(() =>
    buildContentSeoHead({
      title: post.value?.title ?? 'اطلاعیه یافت نشد',
      seo: post.value?.seo,
      noIndex: isAbsent.value || !!error.value,
    }),
  ),
);
</script>

<style scoped>
.content-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.content-page__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: var(--space-8);
  align-items: start;
}

@media (max-width: 900px) {
  .content-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
