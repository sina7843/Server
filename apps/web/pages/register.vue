<template>
  <div class="reg-page">
    <div class="reg-card">
      <!-- Brand -->
      <NuxtLink to="/" class="login-brand">
        <div class="login-brand__mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
          </svg>
        </div>
        <span class="login-brand__name">DRAGON</span>
      </NuxtLink>

      <!-- Step 1: Register -->
      <template v-if="step === 'register'">
        <div>
          <h1 class="login-title">ایجاد حساب کاربری</h1>
          <p class="login-sub">شماره موبایل و رمز عبور انتخاب کنید</p>
        </div>

        <form class="login-form" @submit.prevent="handleRegister">
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
              autocomplete="new-password"
              placeholder="حداقل ۸ کاراکتر"
              dir="ltr"
              :disabled="loading"
              required
            />
          </div>

          <div class="login-field">
            <label class="login-label" for="confirm">تکرار رمز عبور</label>
            <input
              id="confirm"
              v-model="confirmPassword"
              class="login-input"
              type="password"
              autocomplete="new-password"
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
            {{ loading ? 'در حال ارسال…' : 'ادامه' }}
          </button>
        </form>

        <p class="reg-footer">
          حساب دارید؟
          <NuxtLink :to="loginUrl" class="reg-link">ورود</NuxtLink>
        </p>
      </template>

      <!-- Step 2: Verify OTP -->
      <template v-else-if="step === 'verify'">
        <div>
          <h1 class="login-title">تأیید شماره موبایل</h1>
          <p class="login-sub">کد ارسال شده به {{ phone }} را وارد کنید</p>
        </div>

        <form class="login-form" @submit.prevent="handleVerify">
          <div class="login-field">
            <label class="login-label" for="code">کد تأیید</label>
            <input
              id="code"
              v-model="otpCode"
              class="login-input login-input--otp"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              placeholder="_ _ _ _ _ _"
              dir="ltr"
              :disabled="loading"
              maxlength="6"
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
            {{ loading ? 'در حال تأیید…' : 'تأیید و ورود' }}
          </button>

          <button type="button" class="reg-back-btn" :disabled="loading" @click="step = 'register'">
            تغییر شماره موبایل
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { webRegister, webVerifyPhone, webLogin } from '~/features/auth/auth-api';
import { useAuthToken } from '~/composables/useAuthToken';

useHead({ title: 'ثبت‌نام | Dragon', meta: [{ name: 'robots', content: 'noindex,follow' }] });

definePageMeta({ ssr: false });

const {
  public: { apiBaseUrl },
} = useRuntimeConfig();

const route = useRoute();
const { setToken } = useAuthToken();

const step = ref<'register' | 'verify'>('register');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const otpCode = ref('');
const loading = ref(false);
const errorMessage = ref('');

const redirectTarget = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/account',
);

const loginUrl = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
  return redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
});

async function handleRegister() {
  errorMessage.value = '';
  if (password.value.length < 8) {
    errorMessage.value = 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
    return;
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'رمز عبور و تکرار آن یکسان نیستند.';
    return;
  }

  loading.value = true;
  try {
    await webRegister(phone.value, password.value, String(apiBaseUrl));
    step.value = 'verify';
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'خطا در ثبت‌نام.';
  } finally {
    loading.value = false;
  }
}

async function handleVerify() {
  errorMessage.value = '';
  loading.value = true;
  try {
    await webVerifyPhone(phone.value, otpCode.value.trim(), String(apiBaseUrl));
    const { accessToken } = await webLogin(phone.value, password.value, String(apiBaseUrl));
    setToken(accessToken);
    await navigateTo(redirectTarget.value);
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'خطا در تأیید.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.reg-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: var(--bg-base);
}

.reg-card {
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

.login-title {
  font-size: var(--text-h3-size);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin: 0 0 4px;
  letter-spacing: var(--text-h3-tracking);
}

.login-sub {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

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
  box-sizing: border-box;
}

.login-input--otp {
  text-align: center;
  font-size: 22px;
  letter-spacing: 0.25em;
}

.login-input::placeholder {
  color: var(--text-disabled);
  font-family: var(--font-sans-fa);
  letter-spacing: 0.08em;
}

.login-input:focus {
  border-color: var(--purple-500);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
}

.login-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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
  opacity: 0.5;
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

.reg-back-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  transition: color var(--motion-fast) var(--ease-out);
  text-align: center;
}

.reg-back-btn:hover:not(:disabled) {
  color: var(--text-secondary);
}

.reg-footer {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  margin: 0;
}

.reg-link {
  color: var(--purple-300);
  text-decoration: none;
  font-weight: 500;
  margin-right: 4px;
}

.reg-link:hover {
  color: var(--purple-200);
}
</style>
