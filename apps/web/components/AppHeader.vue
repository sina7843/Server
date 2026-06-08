<template>
  <header class="site-header">
    <div class="header-inner">
      <NuxtLink to="/" class="brand" aria-label="Dragon — خانه">
        <div class="brand-mark" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
          </svg>
        </div>
        <span class="brand-name">DRAGON</span>
      </NuxtLink>

      <nav class="header-nav" aria-label="ناوبری اصلی">
        <NuxtLink to="/tournaments" class="nav-link nav-link--highlight" active-class="nav-link--active">تورنمنت‌ها</NuxtLink>
        <NuxtLink to="/news" class="nav-link" active-class="nav-link--active">اخبار</NuxtLink>
        <NuxtLink to="/articles" class="nav-link" active-class="nav-link--active">مقالات</NuxtLink>
        <NuxtLink to="/guides" class="nav-link" active-class="nav-link--active">راهنما</NuxtLink>
        <NuxtLink to="/announcements" class="nav-link" active-class="nav-link--active">اطلاعیه‌ها</NuxtLink>
        <NuxtLink to="/categories" class="nav-link" active-class="nav-link--active">دسته‌بندی‌ها</NuxtLink>
        <NuxtLink to="/search" class="nav-link nav-link--search" active-class="nav-link--active">
          <svg
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
          جستجو
        </NuxtLink>
      </nav>

      <div class="header-actions">
        <!-- Theme toggle -->
        <button
          class="icon-btn"
          :aria-label="theme === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
          type="button"
          @click="toggleTheme"
        >
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

        <!-- Logged-in state -->
        <template v-if="hasToken">
          <NuxtLink to="/account" class="user-chip" aria-label="پروفایل">
            <div class="dr-avatar dr-avatar-sm">{{ userInitial }}</div>
          </NuxtLink>
          <button class="icon-btn" aria-label="خروج" type="button" :disabled="loggingOut" @click="handleLogout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </template>

        <!-- Guest state -->
        <NuxtLink v-else to="/login" class="login-btn-header">ورود</NuxtLink>

        <!-- Mobile hamburger -->
        <button
          class="icon-btn hamburger"
          :aria-label="mobileMenuOpen ? 'بستن منو' : 'باز کردن منو'"
          :aria-expanded="mobileMenuOpen"
          type="button"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg
            v-if="!mobileMenuOpen"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile nav drawer -->
    <Transition name="mobile-nav">
      <div v-if="mobileMenuOpen" class="mobile-nav" role="navigation" aria-label="ناوبری موبایل">
        <NuxtLink to="/tournaments" class="mobile-nav__link mobile-nav__link--accent" @click="mobileMenuOpen = false">تورنمنت‌ها</NuxtLink>
        <div class="mobile-nav__divider" />
        <NuxtLink to="/news" class="mobile-nav__link" @click="mobileMenuOpen = false">اخبار</NuxtLink>
        <NuxtLink to="/articles" class="mobile-nav__link" @click="mobileMenuOpen = false">مقالات</NuxtLink>
        <NuxtLink to="/guides" class="mobile-nav__link" @click="mobileMenuOpen = false">راهنما</NuxtLink>
        <NuxtLink to="/announcements" class="mobile-nav__link" @click="mobileMenuOpen = false">اطلاعیه‌ها</NuxtLink>
        <NuxtLink to="/categories" class="mobile-nav__link" @click="mobileMenuOpen = false">دسته‌بندی‌ها</NuxtLink>
        <NuxtLink to="/search" class="mobile-nav__link" @click="mobileMenuOpen = false">جستجو</NuxtLink>
        <div class="mobile-nav__divider" />
        <template v-if="hasToken">
          <NuxtLink to="/account" class="mobile-nav__link" @click="mobileMenuOpen = false">حساب کاربری</NuxtLink>
          <button class="mobile-nav__link mobile-nav__link--logout" @click="handleLogout; mobileMenuOpen = false">خروج از حساب</button>
        </template>
        <NuxtLink v-else to="/login" class="mobile-nav__link mobile-nav__link--login" @click="mobileMenuOpen = false">ورود</NuxtLink>
      </div>
    </Transition>
  </header>

  <!-- Backdrop -->
  <Transition name="backdrop">
    <div v-if="mobileMenuOpen" class="mobile-backdrop" @click="mobileMenuOpen = false" />
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthToken } from '~/composables/useAuthToken';
import { useTheme } from '~/composables/useTheme';
import { useRoute } from 'vue-router';
import { webLogout } from '~/features/auth/auth-api';

const { hasToken, token, clearToken } = useAuthToken();
const { theme, toggleTheme } = useTheme();
const {
  public: { apiBaseUrl },
} = useRuntimeConfig();
const userInitial = computed(() => 'D');
const mobileMenuOpen = ref(false);
const loggingOut = ref(false);

const route = useRoute();
watch(() => route.path, () => { mobileMenuOpen.value = false; });

async function handleLogout() {
  if (loggingOut.value) return;
  loggingOut.value = true;
  await webLogout(token.value ?? '', String(apiBaseUrl));
  clearToken();
  loggingOut.value = false;
  await navigateTo('/');
}
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
  transition: background var(--motion-base);
}

.header-inner {
  max-width: var(--layout-container-max);
  margin: 0 auto;
  padding: 0 24px;
  height: var(--layout-topbar-h);
  display: flex;
  align-items: center;
  gap: 24px;
}

/* ── Brand ── */
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
  color: #fff;
  box-shadow:
    var(--glow-primary),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition:
    box-shadow var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-spring);
}

.brand:hover .brand-mark {
  box-shadow:
    var(--glow-primary-strong),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transform: scale(1.06) rotate(-3deg);
}

.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
}

/* ── Desktop Nav ── */
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
  padding: 8px 13px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition:
    color var(--motion-fast) var(--ease-out),
    background var(--motion-fast) var(--ease-out);
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--hover-overlay);
}

.nav-link--active {
  color: var(--purple-300);
  background: rgba(109, 40, 217, 0.1);
}

.nav-link--highlight {
  color: var(--danger-400);
}

.nav-link--highlight:hover {
  color: var(--danger-400);
  background: rgba(239, 68, 68, 0.08);
}

/* ── Actions ── */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
    background var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out),
    border-color var(--motion-fast) var(--ease-out),
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

.user-chip {
  display: flex;
  align-items: center;
  text-decoration: none;
  border-radius: 999px;
  transition: opacity var(--motion-fast);
}

.user-chip:hover {
  opacity: 0.8;
}

.login-btn-header {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  background: var(--brand-gradient);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  box-shadow:
    var(--glow-primary),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
  transition:
    box-shadow var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-spring);
}

.login-btn-header:hover {
  box-shadow:
    var(--glow-primary-strong),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
}

/* ── Mobile drawer ── */
.mobile-nav {
  display: flex;
  flex-direction: column;
  padding: 12px 16px 20px;
  border-top: 1px solid var(--glass-hairline);
  background: var(--glass-header);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  gap: 2px;
}

.mobile-nav__link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition:
    color var(--motion-fast) var(--ease-out),
    background var(--motion-fast) var(--ease-out);
}

.mobile-nav__link:hover,
.mobile-nav__link.router-link-active {
  color: var(--text-primary);
  background: var(--hover-overlay);
}

.mobile-nav__link--accent {
  color: var(--danger-400);
}

.mobile-nav__link--login {
  color: var(--purple-300);
  font-weight: 600;
}

.mobile-nav__link--logout {
  background: none;
  border: none;
  cursor: pointer;
  text-align: right;
  width: 100%;
  color: var(--danger-400);
}

.mobile-nav__divider {
  height: 1px;
  background: var(--glass-hairline);
  margin: 6px 0;
}

/* Drawer animation */
.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition:
    opacity var(--motion-base) var(--ease-out),
    transform var(--motion-base) var(--ease-out);
}
.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Backdrop */
.mobile-backdrop {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-sticky) - 1);
  background: rgba(11, 8, 21, 0.55);
  backdrop-filter: blur(2px);
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity var(--motion-base) var(--ease-out);
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* ── Responsive ── */
@media (min-width: 769px) {
  .hamburger {
    display: none;
  }
}

@media (max-width: 768px) {
  .header-nav {
    display: none;
  }
}
</style>
