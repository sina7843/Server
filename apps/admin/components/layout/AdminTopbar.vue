<template>
  <header class="topbar">
    <div class="topbar-start">
      <div class="page-meta">
        <nav class="breadcrumb" aria-label="مسیر">
          <NuxtLink to="/dashboard" class="crumb-link">داشبورد</NuxtLink>
          <span class="crumb-sep">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </span>
          <span class="crumb-current">{{ pageTitle }}</span>
        </nav>
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>
    </div>

    <div class="topbar-end">
      <div class="search-box" role="button" tabindex="0" @click="$emit('search')">
        <svg
          class="search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span class="search-placeholder">جستجو در سیستم…</span>
      </div>

      <button class="icon-btn" aria-label="اعلان‌ها" type="button">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span class="notif-dot" />
      </button>

      <div class="topbar-divider" />

      <div class="user-chip">
        <div class="dr-avatar dr-avatar-sm">{{ userInitial }}</div>
        <span class="user-chip-name">{{ displayName }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminAuth } from '~/composables/useAdminAuth';

defineEmits<{ search: [] }>();

const { displayName } = useAdminAuth();
const route = useRoute();

const userInitial = computed(() =>
  displayName.value ? displayName.value.charAt(0).toUpperCase() : 'A',
);

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'داشبورد',
  '/users': 'کاربران',
  '/roles': 'نقش‌ها',
  '/permissions': 'مجوزها',
  '/content': 'محتوا',
  '/media': 'رسانه',
  '/audit': 'لاگ‌های حسابرسی',
  '/analytics': 'آنالیتیکس',
  '/system/health': 'سلامت سیستم',
  '/system/backups': 'پشتیبان‌گیری',
  '/system/jobs': 'جاب‌ها',
  '/system/notifications': 'اعلان‌ها',
};

const pageTitle = computed(
  () => PAGE_TITLES[route.path] ?? route.path.split('/').filter(Boolean).pop() ?? 'Dragon Admin',
);
</script>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  height: var(--layout-topbar-h);
  background: var(--glass-header);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border-bottom: 1px solid var(--glass-hairline);
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.topbar-start {
}

.page-meta {
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.crumb-link {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 120ms;
}
.crumb-link:hover {
  color: var(--text-secondary);
}

.crumb-sep {
  display: flex;
  align-items: center;
  opacity: 0.5;
}

.crumb-current {
  color: var(--text-primary);
  font-weight: 500;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.005em;
  color: var(--text-primary);
}

.topbar-end {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-box {
  height: 36px;
  width: 240px;
  padding: 0 12px;
  background: var(--input-bg);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition:
    border-color 120ms var(--ease-out),
    box-shadow 120ms;
}
.search-box:hover {
  border-color: var(--glass-border-strong);
}
.search-box:focus {
  outline: 2px solid var(--focus-ring);
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-placeholder {
  font-size: 13px;
  color: var(--text-muted);
  font-family: inherit;
  flex: 1;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 120ms var(--ease-out);
  position: relative;
}
.icon-btn:hover {
  background: var(--hover-overlay);
  color: var(--text-primary);
}

.notif-dot {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 6px #ef4444;
  border: 2px solid var(--surface-page);
}

.topbar-divider {
  width: 1px;
  height: 24px;
  background: var(--glass-border-strong);
  margin: 0 4px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  background: var(--input-bg);
  border: 1px solid var(--glass-border);
}

.user-chip-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
