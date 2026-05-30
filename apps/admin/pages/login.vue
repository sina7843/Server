<template>
  <div>
    <h2 class="login-heading">ورود به پنل مدیریت</h2>
    <p class="login-sub">برای ادامه اطلاعات خود را وارد کنید</p>

    <form class="login-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label" for="phone">شماره موبایل</label>
        <input
          id="phone"
          v-model="phone"
          class="dr-input"
          type="tel"
          autocomplete="tel"
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          dir="ltr"
          :disabled="loading"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="password">رمز عبور</label>
        <input
          id="password"
          v-model="password"
          class="dr-input"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          dir="ltr"
          :disabled="loading"
          required
        />
      </div>

      <div v-if="errorMessage" class="error-alert" role="alert">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {{ errorMessage }}
      </div>

      <button class="dr-btn dr-btn-primary submit-btn" type="submit" :disabled="loading">
        <span v-if="loading" class="spinner" />
        {{ loading ? 'در حال ورود…' : 'ورود' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { adminLogin } from '~/features/auth/admin-auth.api';
import { useAdminAuthState } from '~/composables/useAdminAuthState';
import { useAdminPermissions } from '~/composables/useAdminPermissions';

const router = useRouter();
const route = useRoute();
const { setAuth } = useAdminAuthState();
const { setPermissions } = useAdminPermissions();
const {
  public: { apiBaseUrl },
} = useRuntimeConfig();

const phone = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function handleSubmit() {
  if (loading.value) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    const { token, identity } = await adminLogin(phone.value, password.value, String(apiBaseUrl));
    setAuth(token, identity);
    setPermissions(identity.permissions, identity.isSuperAdmin);

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
    await router.push(redirect);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'ورود ناموفق. لطفاً دوباره تلاش کنید.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-heading {
  font-size: var(--text-h3-size);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin: 0 0 6px;
  letter-spacing: var(--text-h3-tracking);
}

.login-sub {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0 0 28px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--danger-400);
  font-size: 13px;
}

.submit-btn {
  width: 100%;
  justify-content: center;
  height: 46px;
  font-size: 15px;
  border-radius: var(--radius-md);
  margin-top: 4px;
}
.submit-btn:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  animation: dr-spin 0.8s linear infinite;
}
</style>
