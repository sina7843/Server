<template>
  <main class="account-shell">
    <div class="account-shell__header">
      <div class="dr-avatar dr-avatar-lg">{{ userInitial }}</div>
      <div>
        <h1 class="account-shell__title">حساب کاربری</h1>
        <p class="account-shell__subtitle">تنظیمات هویت و امنیت حساب خود را مدیریت کنید.</p>
      </div>
    </div>

    <nav class="account-shell__nav" aria-label="بخش‌های حساب">
      <NuxtLink to="/account/profile" class="account-nav-card dr-card">
        <div class="account-nav-card__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div class="account-nav-card__body">
          <h2 class="account-nav-card__title">پروفایل</h2>
          <p class="account-nav-card__description">نام، نام کاربری، بیوگرافی و تصویر پروفایل</p>
        </div>
        <svg class="account-nav-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </NuxtLink>

      <NuxtLink to="/account/security" class="account-nav-card dr-card">
        <div class="account-nav-card__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div class="account-nav-card__body">
          <h2 class="account-nav-card__title">امنیت</h2>
          <p class="account-nav-card__description">رمز عبور، جلسات فعال و تنظیمات دسترسی</p>
        </div>
        <svg class="account-nav-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </NuxtLink>
    </nav>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth-required',
});

const userInitial = computed(() => 'U');

useHead({
  title: 'حساب کاربری',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
});
</script>

<style scoped>
.account-shell {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}

.account-shell__header {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.account-shell__title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0 0 var(--space-1);
  color: var(--text-primary);
}

.account-shell__subtitle {
  font-size: var(--text-body-sm-size);
  color: var(--text-secondary);
  margin: 0;
}

.account-shell__nav {
  display: grid;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .account-shell__nav {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ── Nav card ── */
.account-nav-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  text-decoration: none;
  transition:
    border-color var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-out);
}

.account-nav-card:hover {
  border-color: rgba(109, 40, 217, 0.35);
  box-shadow: var(--shadow-md), 0 0 0 1px rgba(109, 40, 217, 0.1);
  transform: translateY(-2px);
}

.account-nav-card__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: rgba(109, 40, 217, 0.12);
  color: var(--purple-400);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background var(--motion-fast);
}

.account-nav-card:hover .account-nav-card__icon {
  background: rgba(109, 40, 217, 0.22);
}

.account-nav-card__body {
  flex: 1;
}

.account-nav-card__title {
  font-size: var(--text-body-size);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-1);
}

.account-nav-card__description {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  margin: 0;
}

.account-nav-card__arrow {
  color: var(--text-disabled);
  flex-shrink: 0;
  transition:
    color var(--motion-fast),
    transform var(--motion-fast) var(--ease-spring);
}

.account-nav-card:hover .account-nav-card__arrow {
  color: var(--purple-400);
  transform: translateX(-3px);
}
</style>
