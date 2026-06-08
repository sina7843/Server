<template>
  <div class="page">
    <div class="admin-page-header">
      <div>
        <h1 class="admin-page-title">مدیریت محتوا</h1>
        <p class="admin-page-subtitle">مدیریت پست‌ها، صفحات، دسته‌بندی‌ها و برچسب‌ها</p>
      </div>
    </div>

    <ForbiddenState v-if="!hasAnyContentPermission" />

    <template v-else>
      <!-- Posts section -->
      <template v-if="hasPermission(Permissions.CONTENT_POST_READ)">
        <div class="section-label">پست‌ها</div>
        <div class="hub-grid">
          <NuxtLink to="/content/news" class="hub-card hub-card--news">
            <span class="hub-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a4 4 0 0 1-4-4V6" />
                <path d="M2 13h4" /><path d="M2 17h4" /><path d="M2 9h4" />
              </svg>
            </span>
            <span class="hub-card-title">اخبار</span>
          </NuxtLink>
          <NuxtLink to="/content/articles" class="hub-card hub-card--articles">
            <span class="hub-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            <span class="hub-card-title">مقالات</span>
          </NuxtLink>
          <NuxtLink to="/content/announcements" class="hub-card hub-card--announcements">
            <span class="hub-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <span class="hub-card-title">اعلانات</span>
          </NuxtLink>
          <NuxtLink to="/content/guides" class="hub-card hub-card--guides">
            <span class="hub-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span class="hub-card-title">راهنماها</span>
          </NuxtLink>
          <NuxtLink to="/content/rules" class="hub-card hub-card--rules">
            <span class="hub-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
            <span class="hub-card-title">قوانین</span>
          </NuxtLink>
        </div>
      </template>

      <!-- Pages + Classification -->
      <div class="hub-row">
        <template v-if="hasPermission(Permissions.CONTENT_PAGE_READ)">
          <div class="section-label">صفحات</div>
          <div class="hub-grid hub-grid--sm">
            <NuxtLink to="/content/pages" class="hub-card hub-card--pages">
              <span class="hub-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </span>
              <span class="hub-card-title">مدیریت صفحات</span>
            </NuxtLink>
          </div>
        </template>

        <template v-if="hasPermission(Permissions.CONTENT_CATEGORY_READ)">
          <div class="section-label">طبقه‌بندی</div>
          <div class="hub-grid hub-grid--sm">
            <NuxtLink to="/content/categories" class="hub-card hub-card--categories">
              <span class="hub-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <span class="hub-card-title">دسته‌بندی‌ها</span>
            </NuxtLink>
            <NuxtLink
              v-if="hasPermission(Permissions.CONTENT_TAG_READ)"
              to="/content/tags"
              class="hub-card hub-card--tags"
            >
              <span class="hub-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </span>
              <span class="hub-card-title">برچسب‌ها</span>
            </NuxtLink>
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
  max-width: 900px;
}

.section-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-disabled);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: var(--font-sans-en);
  margin-block-end: 10px;
  margin-block-start: 20px;
}

.section-label:first-of-type {
  margin-block-start: 0;
}

.hub-row {
  margin-block-start: 4px;
}

.hub-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-block-end: 4px;
}

.hub-grid--sm {
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
}

@media (max-width: 768px) {
  .hub-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.hub-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: var(--surface-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  text-decoration: none;
  transition:
    background var(--motion-fast),
    border-color var(--motion-fast),
    transform var(--motion-fast) var(--ease-spring);
}

.hub-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  background: var(--surface-elevated);
}

.hub-card:active {
  transform: scale(0.98);
}

.hub-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
}

.hub-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* ── Icon accent colors ── */
.hub-card--news .hub-card-icon { background: rgba(109, 40, 217, 0.12); color: var(--purple-300); }
.hub-card--news:hover { border-color: rgba(109, 40, 217, 0.3); }

.hub-card--articles .hub-card-icon { background: rgba(6, 182, 212, 0.12); color: var(--cyan-400); }
.hub-card--articles:hover { border-color: rgba(6, 182, 212, 0.3); }

.hub-card--announcements .hub-card-icon { background: rgba(245, 158, 11, 0.12); color: var(--warning-400); }
.hub-card--announcements:hover { border-color: rgba(245, 158, 11, 0.3); }

.hub-card--guides .hub-card-icon { background: rgba(16, 185, 129, 0.12); color: var(--success-400); }
.hub-card--guides:hover { border-color: rgba(16, 185, 129, 0.3); }

.hub-card--rules .hub-card-icon { background: rgba(239, 68, 68, 0.1); color: var(--danger-400); }
.hub-card--rules:hover { border-color: rgba(239, 68, 68, 0.25); }

.hub-card--pages .hub-card-icon { background: rgba(109, 40, 217, 0.1); color: var(--purple-300); }
.hub-card--categories .hub-card-icon { background: rgba(6, 182, 212, 0.1); color: var(--cyan-400); }
.hub-card--tags .hub-card-icon { background: rgba(217, 70, 239, 0.1); color: var(--magenta-300); }
</style>
