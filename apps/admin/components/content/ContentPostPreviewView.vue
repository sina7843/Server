<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink :to="`/content/${pluralPath}/${postId}/edit`" class="back-link">
        ← بازگشت به ویرایش
      </NuxtLink>
      <h1 class="page-title">پیش‌نمایش: {{ post?.title ?? '…' }}</h1>
    </div>

    <LoadingState v-if="postLoading" />

    <ErrorState v-else-if="postError" :message="postError" />

    <ForbiddenState v-else-if="!hasPermission(Permissions.CONTENT_POST_READ)" />

    <template v-else-if="post">
      <div class="meta-bar">
        <ContentStatusBadge :status="post.status" />
        <span class="meta-slug">/{{ post.slug }}</span>
        <span class="meta-sep">·</span>
        <span class="meta-date">آخرین ویرایش: {{ formatDate(post.updatedAt) }}</span>
      </div>

      <div class="preview-notice">
        این پیش‌نمایش برای مدیران است. محتوا تا پس از انتشار در دسترس عمومی قرار نمی‌گیرد.
      </div>

      <article class="preview-body" v-html="post.bodyHtml" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';
import * as contentApi from '~/features/content/admin-content.api';

const props = defineProps<{
  pluralPath: string;
  postId: string;
}>();

const { hasPermission } = useAdminPermissions();
const { post, postLoading, postError } = useAdminContent();

async function loadPreview() {
  const { post: _post } = useAdminContent();
  _post.value = null;

  try {
    const res = await contentApi.previewPost(useAdminApiClient(), props.postId);
    _post.value = res.post;
  } catch (err) {
    const { postError: _err } = useAdminContent();
    _err.value = err instanceof Error ? err.message : 'خطا در بارگذاری پیش‌نمایش.';
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

onMounted(loadPreview);
</script>

<style scoped>
.page {
  max-width: 800px;
}

.page-header {
  margin-block-end: 1rem;
}

.back-link {
  font-size: 0.85rem;
  color: #3b82f6;
  text-decoration: none;
  display: inline-block;
  margin-block-end: 0.4rem;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-block-end: 0.75rem;
  font-size: 0.875rem;
  color: #64748b;
  flex-wrap: wrap;
}

.meta-slug {
  font-family: monospace;
  font-size: 0.8rem;
}

.meta-sep {
  color: #cbd5e1;
}

.meta-date {
  font-size: 0.8rem;
}

.preview-notice {
  background: #fef9c3;
  border: 1px solid #fde047;
  border-radius: 0.5rem;
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  color: #713f12;
  margin-block-end: 1.25rem;
}

.preview-body {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem 2rem;
  background: #fff;
  line-height: 1.75;
  color: #1e293b;
  font-size: 1rem;
}

.preview-body :deep(h1),
.preview-body :deep(h2),
.preview-body :deep(h3) {
  margin-block: 1.2rem 0.5rem;
}

.preview-body :deep(p) {
  margin-block: 0.75rem;
}

.preview-body :deep(ul),
.preview-body :deep(ol) {
  padding-inline-start: 1.5rem;
  margin-block: 0.75rem;
}

.preview-body :deep(pre) {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  padding: 1rem;
  overflow-x: auto;
}

.preview-body :deep(code) {
  background: #f1f5f9;
  padding: 0.15rem 0.35rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.preview-body :deep(blockquote) {
  border-inline-start: 4px solid #3b82f6;
  margin-inline-start: 0;
  padding-inline-start: 1rem;
  color: #475569;
}

.preview-body :deep(a) {
  color: #2563eb;
}

.preview-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
}

.preview-body :deep(th),
.preview-body :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
}

.preview-body :deep(th) {
  background: #f8fafc;
  font-weight: 600;
}
</style>
