<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">مدیریت محتوا</h1>
    </div>

    <ForbiddenState v-if="!hasAnyContentPermission" />

    <template v-else>
      <div class="sections">
        <template v-if="hasPermission(Permissions.CONTENT_POST_READ)">
          <div class="section">
            <h2 class="section-title">پست‌ها</h2>
            <div class="section-links">
              <NuxtLink to="/content/news" class="section-link">اخبار</NuxtLink>
              <NuxtLink to="/content/articles" class="section-link">مقالات</NuxtLink>
              <NuxtLink to="/content/announcements" class="section-link">اعلانات</NuxtLink>
              <NuxtLink to="/content/guides" class="section-link">راهنماها</NuxtLink>
              <NuxtLink to="/content/rules" class="section-link">قوانین</NuxtLink>
            </div>
          </div>
        </template>

        <template v-if="hasPermission(Permissions.CONTENT_PAGE_READ)">
          <div class="section">
            <h2 class="section-title">صفحات</h2>
            <div class="section-links">
              <NuxtLink to="/content/pages" class="section-link">مدیریت صفحات</NuxtLink>
            </div>
          </div>
        </template>

        <template v-if="hasPermission(Permissions.CONTENT_CATEGORY_READ)">
          <div class="section">
            <h2 class="section-title">طبقه‌بندی</h2>
            <div class="section-links">
              <NuxtLink to="/content/categories" class="section-link">دسته‌بندی‌ها</NuxtLink>
              <NuxtLink
                v-if="hasPermission(Permissions.CONTENT_TAG_READ)"
                to="/content/tags"
                class="section-link"
              >
                برچسب‌ها
              </NuxtLink>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.CONTENT_POST_READ,
});
useHead({ title: 'مدیریت محتوا — Dragon Admin' });

const { hasPermission } = useAdminPermissions();

const hasAnyContentPermission = computed(
  () =>
    hasPermission(Permissions.CONTENT_POST_READ) ||
    hasPermission(Permissions.CONTENT_PAGE_READ) ||
    hasPermission(Permissions.CONTENT_CATEGORY_READ),
);
</script>

<style scoped>
.page {
  max-width: 760px;
}

.page-header {
  margin-block-end: 1.5rem;
}
.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.section-title {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
}

.section-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.section-link {
  display: inline-block;
  padding: 0.45rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #334155;
  text-decoration: none;
  background: #f8fafc;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.section-link:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}
</style>
