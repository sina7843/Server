<template>
  <main class="content-page">
    <ContentStateMessage v-if="pending" state="loading" />
    <ContentStateMessage v-else-if="error" state="error" />
    <ContentStateMessage v-else-if="!post" state="not-found" />
    <ContentArticle
      v-else
      :post="post"
      :categories="resolvedCategories"
      :tags="resolvedTags"
    />
  </main>
</template>

<script setup lang="ts">
import { buildContentSeoHead } from '../../features/content/content-seo';

const route = useRoute();
const slug = route.params.slug as string;
const content = usePublicContent();

const { data, pending, error } = await useAsyncData(`article-${slug}`, async () => {
  try {
    const [postResult, catsResult, tagsResult] = await Promise.allSettled([
      content.getArticle(slug),
      content.listCategories(),
      content.listTags(),
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

useHead(
  computed(() =>
    buildContentSeoHead({
      title: post.value?.title ?? 'مقاله یافت نشد',
      seo: post.value?.seo,
      noIndex: isAbsent.value || !!error.value,
    }),
  ),
);
</script>

<style scoped>
.content-page {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}
</style>
