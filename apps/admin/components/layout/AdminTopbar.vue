<template>
  <header class="topbar">
    <div class="topbar-start">
      <div class="page-meta">
        <nav class="breadcrumb" aria-label="مسیر">
          <NuxtLink to="/dashboard" class="crumb-link">داشبورد</NuxtLink>
          <span class="crumb-sep" aria-hidden="true">
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
      <!-- Search -->
      <div
        class="search-box"
        role="button"
        tabindex="0"
        aria-label="جستجو در سیستم"
        @click="$emit('search')"
        @keydown.enter="$emit('search')"
        @keydown.space.prevent="$emit('search')"
      >
        <svg
          class="search-icon"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span class="search-placeholder">جستجو در سیستم…</span>
        <kbd class="search-kbd">⌘K</kbd>
      </div>

      <!-- Theme toggle -->
      <button
        class="icon-btn"
        :aria-label="theme === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
        type="button"
        @click="toggleTheme"
      >
        <!-- Sun — shown in dark mode -->
        <svg
          v-if="theme === 'dark'"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <!-- Moon — shown in light mode -->
        <svg
          v-else
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>

      <div class="topbar-divider" aria-hidden="true" />

      <!-- User chip -->
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
import { useTheme } from '~/composables/useTheme';

defineEmits<{ search: [] }>();

const { displayName } = useAdminAuth();
const { theme, toggleTheme } = useTheme();
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
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

/* ── Page meta ── */
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
  transition: color var(--motion-fast);
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
  color: var(--text-secondary);
  font-weight: 500;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

/* ── Right side ── */
.topbar-end {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-box {
  height: 36px;
  width: 220px;
  padding: 0 10px 0 12px;
  background: var(--input-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition:
    border-color var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast);
}

.search-box:hover {
  border-color: var(--glass-border-strong);
}

.search-box:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-placeholder {
  font-size: 13px;
  color: var(--text-muted);
  flex: 1;
}

.search-kbd {
  font-size: 11px;
  color: var(--text-disabled);
  background: var(--hover-overlay);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 1px 5px;
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-border);
  background: var(--hover-overlay);
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    background var(--motion-fast),
    color var(--motion-fast),
    border-color var(--motion-fast),
    transform var(--motion-fast) var(--ease-spring);
}

.icon-btn:hover {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
  border-color: var(--glass-border-strong);
  transform: scale(1.05);
}

.icon-btn:active {
  transform: scale(0.95);
}

.topbar-divider {
  width: 1px;
  height: 22px;
  background: var(--glass-border-strong);
  margin: 0 2px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: var(--radius-pill);
  background: var(--hover-overlay);
  border: 1px solid var(--glass-border);
  transition: background var(--motion-fast), border-color var(--motion-fast);
}

.user-chip:hover {
  background: var(--hover-overlay-strong);
  border-color: var(--glass-border-strong);
}

.user-chip-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
