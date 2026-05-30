<template>
  <header class="site-header">
    <div class="header-inner">
      <NuxtLink to="/" class="brand" aria-label="Dragon — خانه">
        <div class="brand-mark" aria-hidden="true">D</div>
        <span class="brand-name">DRAGON</span>
      </NuxtLink>

      <nav class="header-nav" aria-label="ناوبری اصلی">
        <NuxtLink to="/news" class="nav-link" active-class="nav-link--active">اخبار</NuxtLink>
        <NuxtLink to="/articles" class="nav-link" active-class="nav-link--active">مقالات</NuxtLink>
        <NuxtLink to="/guides" class="nav-link" active-class="nav-link--active">راهنما</NuxtLink>
        <NuxtLink to="/categories" class="nav-link" active-class="nav-link--active">دسته‌بندی‌ها</NuxtLink>
        <NuxtLink to="/search" class="nav-link" active-class="nav-link--active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          جستجو
        </NuxtLink>
      </nav>

      <div class="header-actions">
        <NuxtLink v-if="hasToken" to="/account" class="user-chip" aria-label="پروفایل">
          <div class="dr-avatar dr-avatar-sm">{{ userInitial }}</div>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthToken } from '~/composables/useAuthToken';

const { hasToken } = useAuthToken();
const userInitial = computed(() => 'U');
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--glass-header);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border-bottom: 1px solid var(--glass-hairline);
}

.header-inner {
  max-width: var(--layout-container-max);
  margin: 0 auto;
  padding: 0 24px;
  height: var(--layout-topbar-h);
  display: flex;
  align-items: center;
  gap: 28px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-primary);
  flex-shrink: 0;
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--brand-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  color: #fff;
  box-shadow: var(--glow-primary);
}

.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: -0.01em;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 120ms var(--ease-out);
}
.nav-link:hover {
  color: var(--text-primary);
  background: var(--hover-overlay);
}
.nav-link--active {
  color: var(--text-primary);
  background: var(--hover-overlay);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.user-chip {
  display: flex;
  align-items: center;
  text-decoration: none;
}
</style>
