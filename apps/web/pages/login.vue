<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Brand -->
      <NuxtLink to="/" class="login-brand">
        <div class="login-brand__mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
          </svg>
        </div>
        <span class="login-brand__name">DRAGON</span>
      </NuxtLink>

      <h1 class="login-title">ورود به حساب کاربری</h1>
      <p class="login-sub">با شماره موبایل و رمز عبور وارد شوید</p>

      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="login-field">
          <label class="login-label" for="phone">شماره موبایل</label>
          <input
            id="phone"
            v-model="phone"
            class="login-input"
            type="tel"
            autocomplete="tel"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            dir="ltr"
            :disabled="loading"
            required
          />
        </div>

        <div class="login-field">
          <label class="login-label" for="password">رمز عبور</label>
          <input
            id="password"
            v-model="password"
            class="login-input"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            dir="ltr"
            :disabled="loading"
            required
          />
        </div>

        <div v-if="errorMessage" class="login-error" role="alert">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ errorMessage }}
        </div>

        <button class="login-btn" type="submit" :disabled="loading">
          <span v-if="loading" class="login-spinner" aria-hidden="true" />
          {{ loading ? 'در حال ورود…' : 'ورود' }}
        </button>
      </form>

      <p class="login-register-hint">
        حساب ندارید؟
        <NuxtLink to="/register" class="login-register-link">ثبت‌نام</NuxtLink>
      </p>

      <NuxtLink to="/" class="login-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 19 19 12 12 5" />
        </svg>
        بازگشت به سایت
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthToken } from '~/composables/useAuthToken';
import { webLogin } from '~/features/auth/auth-api';

useHead({ title: 'ورود | Dragon' });

const {
  public: { apiBaseUrl, adminUrl },
} = useRuntimeConfig();

const route = useRoute();
const { setToken } = useAuthToken();

const phone = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function handleSubmit() {
  if (loading.value) return;
  loading.value = true;
  errorMessage.value = '';

  try {
    const { accessToken, isAdmin } = await webLogin(phone.value, password.value, String(apiBaseUrl));
    setToken(accessToken);

    if (isAdmin && adminUrl) {
      window.location.href = String(adminUrl);
      return;
    }

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/account';
    await navigateTo(redirect);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'ورود ناموفق. لطفاً دوباره تلاش کنید.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: var(--bg-base);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--glass-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8) var(--space-7);
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* Brand */
.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-primary);
  width: fit-content;
}

.login-brand__mark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--brand-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: var(--glow-primary);
}

.login-brand__name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.05em;
}

/* Headings */
.login-title {
  font-size: var(--text-h3-size);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: var(--text-h3-tracking);
}

.login-sub {
  font-size: 14px;
  color: var(--text-muted);
  margin: -var(--space-3) 0 0;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.login-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.login-input {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  background: var(--input-bg, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-mono);
  transition: border-color var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out);
  outline: none;
}

.login-input::placeholder {
  color: var(--text-disabled);
  font-family: var(--font-sans);
  letter-spacing: 0.08em;
}

.login-input:focus {
  border-color: var(--purple-500);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
}

.login-input:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}

/* Error */
.login-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border-radius: var(--radius-md);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--danger-400);
  font-size: 13px;
}

/* Button */
.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--brand-gradient);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  margin-top: var(--space-1);
  box-shadow: var(--glow-primary);
  transition: opacity var(--motion-fast) var(--ease-out), transform var(--motion-fast) var(--ease-spring);
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}

.login-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  animation: dr-spin 0.8s linear infinite;
  flex-shrink: 0;
}

.login-register-hint {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  margin: 0;
}

.login-register-link {
  color: var(--purple-300);
  text-decoration: none;
  font-weight: 500;
  margin-right: 4px;
}

.login-register-link:hover {
  color: var(--purple-200);
}

/* Back link */
.login-back {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  transition: color var(--motion-fast) var(--ease-out);
  direction: rtl;
}

.login-back svg {
  transform: scaleX(-1);
}

.login-back:hover {
  color: var(--text-secondary);
}
</style>
