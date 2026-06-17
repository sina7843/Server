# Password Reset Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3-step forgot-password UI to both Nuxt apps (`apps/web` for users, `apps/admin` for admins), wiring the already-shipped SMS-OTP reset API.

**Architecture:** One multi-step page per app (route `/forgot-password`) with internal `step` state (`phone` → `otp` → `reset`), mirroring the existing register→verify flow. Each app gets three thin API wrapper functions that call the existing endpoints via the SDK's `createApiClient(...).request`. No backend changes.

**Tech Stack:** Nuxt 3 / Vue 3 `<script setup>`, TypeScript, `@dragon/sdk` (`createApiClient`, `ApiClientError`), `@dragon/types`, Jest + ts-jest (unit tests for the API wrappers).

**Spec:** `docs/superpowers/specs/2026-06-17-password-reset-frontend-design.md`

---

## Reference facts (do not re-derive)

Endpoints (paths are relative to the configured `apiBaseUrl` host root, same convention as `webRegister`):
- `POST /api/v1/auth/password/forgot` — body `{ phone }` → `AuthGenericResponse`. Returns 200 even for non-existent accounts (anti-enumeration); 400 only on malformed phone.
- `POST /api/v1/auth/password/verify-reset-otp` — body `{ phone, code }` → `VerifyResetOtpResponse` (`{ resetToken: string }`); 400 on wrong/expired code.
- `POST /api/v1/auth/password/reset` — body `{ resetToken, newPassword }` → `AuthGenericResponse`; 401 on bad/expired token, 400 on weak password.

Types live in `@dragon/types` (`AuthGenericResponse`, `VerifyResetOtpResponse`). The SDK does **not** re-export them.

`ApiClientError` (from `@dragon/sdk`) has a `.status?: number`. The SDK `request` throws it on non-2xx.

Middleware in both apps is route-applied (named: `apps/web/middleware/auth-required.ts`, `apps/admin/middleware/admin-auth-required.ts`), not global. `login.vue` / `register.vue` declare no middleware and are public, so `/forgot-password` is public by default.

Web error copy = Persian (matches `auth-api.ts`). Admin API wrappers = English error strings (matches existing `admin-auth.api.ts`, e.g. `'Invalid credentials.'`).

---

## File Structure

**Web**
- Modify: `apps/web/features/auth/auth-api.ts` — add `webForgotPassword`, `webVerifyResetOtp`, `webResetPassword`.
- Create: `apps/web/features/auth/auth-api.reset.spec.ts` — unit tests for the three new functions.
- Create: `apps/web/pages/forgot-password.vue` — 3-step page.
- Modify: `apps/web/pages/login.vue` — add forgot-password link.

**Admin**
- Modify: `apps/admin/features/auth/admin-auth.api.ts` — add `adminForgotPassword`, `adminVerifyResetOtp`, `adminResetPassword`.
- Create: `apps/admin/features/auth/admin-auth.reset.spec.ts` — unit tests.
- Create: `apps/admin/pages/forgot-password.vue` — 3-step page (renders into `default.vue` auth-card layout, like `login.vue`).
- Modify: `apps/admin/pages/login.vue` — add forgot-password link.

Run tests from each app dir with `pnpm test`. In this WSL repo, invoke pnpm via: `wsl bash -lic "cd ~/projects/dragon-ecosystem/apps/web && pnpm test"` (swap `apps/admin` as needed).

---

## Task 1: Web API wrapper functions (TDD)

**Files:**
- Test: `apps/web/features/auth/auth-api.reset.spec.ts`
- Modify: `apps/web/features/auth/auth-api.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/features/auth/auth-api.reset.spec.ts`:

```ts
import { ApiClientError } from '@dragon/sdk';
import { webForgotPassword, webVerifyResetOtp, webResetPassword } from './auth-api';

const mockFetch = jest.fn();
Object.assign(globalThis, { fetch: mockFetch });

beforeEach(() => {
  mockFetch.mockReset();
});

function mockOk(body: unknown = { success: true, message: 'ok' }) {
  mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => body });
}
function mockErr(status: number) {
  mockFetch.mockResolvedValueOnce({ ok: false, status, json: async () => ({}) });
}

describe('webForgotPassword', () => {
  it('POSTs phone to the forgot endpoint and resolves on success', async () => {
    mockOk();
    await expect(webForgotPassword('09120000000', 'https://api.test')).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/password/forgot'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ phone: '09120000000' }) }),
    );
  });

  it('throws a Persian invalid-phone message on 400', async () => {
    mockErr(400);
    await expect(webForgotPassword('bad', 'https://api.test')).rejects.toThrow('شماره موبایل معتبر نیست.');
  });
});

describe('webVerifyResetOtp', () => {
  it('returns the resetToken on success', async () => {
    mockOk({ resetToken: 'tok-123' });
    const token = await webVerifyResetOtp('09120000000', '123456', 'https://api.test');
    expect(token).toBe('tok-123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/password/verify-reset-otp'),
      expect.objectContaining({ body: JSON.stringify({ phone: '09120000000', code: '123456' }) }),
    );
  });

  it('throws a wrong-code message on 400', async () => {
    mockErr(400);
    await expect(webVerifyResetOtp('09120000000', '000000', 'https://api.test')).rejects.toThrow(
      'کد تأیید اشتباه یا منقضی شده است.',
    );
  });
});

describe('webResetPassword', () => {
  it('POSTs token and new password and resolves on success', async () => {
    mockOk();
    await expect(webResetPassword('tok-123', 'newpass12', 'https://api.test')).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/password/reset'),
      expect.objectContaining({ body: JSON.stringify({ resetToken: 'tok-123', newPassword: 'newpass12' }) }),
    );
  });

  it('throws an expired-session message on 401', async () => {
    mockErr(401);
    await expect(webResetPassword('expired', 'newpass12', 'https://api.test')).rejects.toThrow(
      'نشست بازنشانی منقضی شده است. لطفاً دوباره تلاش کنید.',
    );
  });

  it('throws a weak-password message on 400', async () => {
    mockErr(400);
    await expect(webResetPassword('tok-123', 'short', 'https://api.test')).rejects.toThrow(
      'رمز عبور معتبر نیست.',
    );
  });

  it('is an ApiClientError-aware mapping (sanity: ApiClientError import resolves)', () => {
    expect(typeof ApiClientError).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `wsl bash -lic "cd ~/projects/dragon-ecosystem/apps/web && pnpm test auth-api.reset"`
Expected: FAIL — `webForgotPassword`/`webVerifyResetOtp`/`webResetPassword` are not exported.

- [ ] **Step 3: Add the implementation**

In `apps/web/features/auth/auth-api.ts`, change the types import to include `VerifyResetOtpResponse`:

```ts
import type { AuthGenericResponse, VerifyResetOtpResponse } from '@dragon/types';
```

Then append these three functions at the end of the file:

```ts
export async function webForgotPassword(phone: string, apiBaseUrl: string): Promise<void> {
  const client = createApiClient({ baseUrl: apiBaseUrl });
  try {
    await client.request<AuthGenericResponse>({
      method: 'POST',
      path: '/api/v1/auth/password/forgot',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 400) {
      throw new Error('شماره موبایل معتبر نیست.');
    }
    throw new Error('خطا در ارسال کد. لطفاً دوباره تلاش کنید.');
  }
}

export async function webVerifyResetOtp(
  phone: string,
  code: string,
  apiBaseUrl: string,
): Promise<string> {
  const client = createApiClient({ baseUrl: apiBaseUrl });
  try {
    const response = await client.request<VerifyResetOtpResponse>({
      method: 'POST',
      path: '/api/v1/auth/password/verify-reset-otp',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    return response.resetToken;
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 400) {
      throw new Error('کد تأیید اشتباه یا منقضی شده است.');
    }
    throw new Error('خطا در تأیید کد. لطفاً دوباره تلاش کنید.');
  }
}

export async function webResetPassword(
  resetToken: string,
  newPassword: string,
  apiBaseUrl: string,
): Promise<void> {
  const client = createApiClient({ baseUrl: apiBaseUrl });
  try {
    await client.request<AuthGenericResponse>({
      method: 'POST',
      path: '/api/v1/auth/password/reset',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword }),
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      throw new Error('نشست بازنشانی منقضی شده است. لطفاً دوباره تلاش کنید.');
    }
    if (error instanceof ApiClientError && error.status === 400) {
      throw new Error('رمز عبور معتبر نیست.');
    }
    throw new Error('خطا در بازنشانی رمز عبور. لطفاً دوباره تلاش کنید.');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `wsl bash -lic "cd ~/projects/dragon-ecosystem/apps/web && pnpm test auth-api.reset"`
Expected: PASS (all specs green).

- [ ] **Step 5: Commit**

```bash
git add apps/web/features/auth/auth-api.ts apps/web/features/auth/auth-api.reset.spec.ts
git commit -m "feat(web): add password-reset API wrappers"
```

---

## Task 2: Web forgot-password page + login link

**Files:**
- Create: `apps/web/pages/forgot-password.vue`
- Modify: `apps/web/pages/login.vue`

No unit test — this is a page (parity with `register.vue`, which has none). Verified manually in Task 5.

- [ ] **Step 1: Create the page**

Create `apps/web/pages/forgot-password.vue`. (Styles are copied verbatim from `register.vue` so the page matches the existing register/verify look — reuse its `.reg-page`, `.reg-card`, `.login-*`, `.reg-*` rules.)

```vue
<template>
  <div class="reg-page">
    <div class="reg-card">
      <NuxtLink to="/" class="login-brand">
        <div class="login-brand__mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
          </svg>
        </div>
        <span class="login-brand__name">DRAGON</span>
      </NuxtLink>

      <!-- Step 1: phone -->
      <template v-if="step === 'phone'">
        <div>
          <h1 class="login-title">بازیابی رمز عبور</h1>
          <p class="login-sub">شماره موبایل خود را وارد کنید تا کد تأیید ارسال شود</p>
        </div>
        <form class="login-form" @submit.prevent="handleRequest">
          <div class="login-field">
            <label class="login-label" for="phone">شماره موبایل</label>
            <input id="phone" v-model="phone" class="login-input" type="tel" autocomplete="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" :disabled="loading" required />
          </div>
          <div v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</div>
          <button class="login-btn" type="submit" :disabled="loading">
            <span v-if="loading" class="login-spinner" aria-hidden="true" />
            {{ loading ? 'در حال ارسال…' : 'ارسال کد' }}
          </button>
        </form>
        <p class="reg-footer">
          رمز عبور را به یاد آوردید؟
          <NuxtLink to="/login" class="reg-link">ورود</NuxtLink>
        </p>
      </template>

      <!-- Step 2: otp -->
      <template v-else-if="step === 'otp'">
        <div>
          <h1 class="login-title">تأیید کد</h1>
          <p class="login-sub">کد ارسال‌شده به {{ phone }} را وارد کنید</p>
        </div>
        <form class="login-form" @submit.prevent="handleVerify">
          <div class="login-field">
            <label class="login-label" for="code">کد تأیید</label>
            <input id="code" v-model="otpCode" class="login-input login-input--otp" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="_ _ _ _ _ _" dir="ltr" :disabled="loading" maxlength="6" required />
          </div>
          <div v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</div>
          <button class="login-btn" type="submit" :disabled="loading">
            <span v-if="loading" class="login-spinner" aria-hidden="true" />
            {{ loading ? 'در حال تأیید…' : 'تأیید کد' }}
          </button>
          <button type="button" class="reg-back-btn" :disabled="loading" @click="goToPhoneStep">
            تغییر شماره موبایل
          </button>
        </form>
      </template>

      <!-- Step 3: reset -->
      <template v-else>
        <div>
          <h1 class="login-title">رمز عبور جدید</h1>
          <p class="login-sub">رمز عبور تازه‌ای انتخاب کنید</p>
        </div>
        <form class="login-form" @submit.prevent="handleReset">
          <div class="login-field">
            <label class="login-label" for="password">رمز عبور جدید</label>
            <input id="password" v-model="password" class="login-input" type="password" autocomplete="new-password" placeholder="حداقل ۸ کاراکتر" dir="ltr" :disabled="loading" required />
          </div>
          <div class="login-field">
            <label class="login-label" for="confirm">تکرار رمز عبور</label>
            <input id="confirm" v-model="confirmPassword" class="login-input" type="password" autocomplete="new-password" placeholder="••••••••" dir="ltr" :disabled="loading" required />
          </div>
          <div v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</div>
          <button class="login-btn" type="submit" :disabled="loading">
            <span v-if="loading" class="login-spinner" aria-hidden="true" />
            {{ loading ? 'در حال ذخیره…' : 'تغییر رمز عبور' }}
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { webForgotPassword, webVerifyResetOtp, webResetPassword } from '~/features/auth/auth-api';

useHead({ title: 'بازیابی رمز عبور | Dragon', meta: [{ name: 'robots', content: 'noindex,follow' }] });
definePageMeta({ ssr: false });

const {
  public: { apiBaseUrl },
} = useRuntimeConfig();

const step = ref<'phone' | 'otp' | 'reset'>('phone');
const phone = ref('');
const otpCode = ref('');
const resetToken = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');

function goToPhoneStep() {
  step.value = 'phone';
  errorMessage.value = '';
}

async function handleRequest() {
  if (loading.value) return;
  errorMessage.value = '';
  loading.value = true;
  try {
    await webForgotPassword(phone.value.trim(), String(apiBaseUrl));
    step.value = 'otp';
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'خطا در ارسال کد.';
  } finally {
    loading.value = false;
  }
}

async function handleVerify() {
  if (loading.value) return;
  errorMessage.value = '';
  loading.value = true;
  try {
    resetToken.value = await webVerifyResetOtp(phone.value.trim(), otpCode.value.trim(), String(apiBaseUrl));
    step.value = 'reset';
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'خطا در تأیید کد.';
  } finally {
    loading.value = false;
  }
}

async function handleReset() {
  if (loading.value) return;
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
    await webResetPassword(resetToken.value, password.value, String(apiBaseUrl));
    await navigateTo('/login?reset=success');
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'خطا در بازنشانی رمز عبور.';
    // Token bad/expired → send the user back to request a fresh code.
    if (errorMessage.value.includes('نشست بازنشانی منقضی')) {
      step.value = 'phone';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.reg-page { min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: var(--space-6); background: var(--bg-base); }
.reg-card { width: 100%; max-width: 420px; background: var(--glass-card); border: 1px solid var(--glass-border); border-radius: var(--radius-xl); padding: var(--space-8) var(--space-7); backdrop-filter: blur(24px) saturate(140%); -webkit-backdrop-filter: blur(24px) saturate(140%); box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4); display: flex; flex-direction: column; gap: var(--space-5); }
.login-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text-primary); width: fit-content; }
.login-brand__mark { width: 40px; height: 40px; border-radius: 12px; background: var(--brand-gradient); display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: var(--glow-primary); }
.login-brand__name { font-family: var(--font-display); font-weight: 700; font-size: 15px; letter-spacing: 0.05em; }
.login-title { font-size: var(--text-h3-size); font-weight: var(--weight-bold); color: var(--text-primary); margin: 0 0 4px; letter-spacing: var(--text-h3-tracking); }
.login-sub { font-size: 14px; color: var(--text-muted); margin: 0; }
.login-form { display: flex; flex-direction: column; gap: var(--space-4); }
.login-field { display: flex; flex-direction: column; gap: 7px; }
.login-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
.login-input { width: 100%; height: 46px; padding: 0 14px; background: var(--input-bg, rgba(255, 255, 255, 0.04)); border: 1px solid var(--glass-border); border-radius: var(--radius-md); color: var(--text-primary); font-size: 14px; font-family: var(--font-mono); transition: border-color var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out); outline: none; box-sizing: border-box; }
.login-input--otp { text-align: center; font-size: 22px; letter-spacing: 0.25em; }
.login-input::placeholder { color: var(--text-disabled); font-family: var(--font-sans-fa); letter-spacing: 0.08em; }
.login-input:focus { border-color: var(--purple-500); box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18); }
.login-input:disabled { opacity: 0.5; cursor: not-allowed; }
.login-error { display: flex; align-items: center; gap: 8px; padding: 11px 14px; border-radius: var(--radius-md); background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: var(--danger-400); font-size: 13px; }
.login-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 48px; border-radius: var(--radius-md); background: var(--brand-gradient); color: #fff; font-size: 15px; font-weight: 600; border: none; cursor: pointer; box-shadow: var(--glow-primary); transition: opacity var(--motion-fast) var(--ease-out), transform var(--motion-fast) var(--ease-spring); }
.login-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.login-btn:active:not(:disabled) { transform: translateY(0); }
.login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.login-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: #fff; animation: dr-spin 0.8s linear infinite; flex-shrink: 0; }
.reg-back-btn { background: none; border: none; color: var(--text-muted); font-size: 13px; cursor: pointer; padding: var(--space-2); border-radius: var(--radius-sm); transition: color var(--motion-fast) var(--ease-out); text-align: center; }
.reg-back-btn:hover:not(:disabled) { color: var(--text-secondary); }
.reg-footer { font-size: 13px; color: var(--text-muted); text-align: center; margin: 0; }
.reg-link { color: var(--purple-300); text-decoration: none; font-weight: 500; margin-right: 4px; }
.reg-link:hover { color: var(--purple-200); }
</style>
```

- [ ] **Step 2: Add the forgot-password link to login.vue**

In `apps/web/pages/login.vue`, immediately after the password `</div>` field block (the `<div class="login-field">` containing the `password` input, which ends at line 46) and before the error block, insert:

```html
        <NuxtLink to="/forgot-password" class="login-forgot-link">رمز عبور را فراموش کرده‌اید؟</NuxtLink>
```

Then add to the `<style scoped>` block:

```css
.login-forgot-link { font-size: 13px; color: var(--purple-300); text-decoration: none; align-self: flex-start; }
.login-forgot-link:hover { color: var(--purple-200); }
```

- [ ] **Step 3: Type-check / build sanity**

Run: `wsl bash -lic "cd ~/projects/dragon-ecosystem/apps/web && pnpm exec nuxi typecheck"`
Expected: No errors referencing `forgot-password.vue` or `login.vue`. (If the project has no `typecheck` script, run `pnpm exec vue-tsc --noEmit` or skip to Task 5 manual check.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/pages/forgot-password.vue apps/web/pages/login.vue
git commit -m "feat(web): add forgot-password page and login link"
```

---

## Task 3: Admin API wrapper functions (TDD)

**Files:**
- Test: `apps/admin/features/auth/admin-auth.reset.spec.ts`
- Modify: `apps/admin/features/auth/admin-auth.api.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/admin/features/auth/admin-auth.reset.spec.ts`:

```ts
import { adminForgotPassword, adminVerifyResetOtp, adminResetPassword } from './admin-auth.api';

const mockFetch = jest.fn();
Object.assign(globalThis, { fetch: mockFetch });

beforeEach(() => {
  mockFetch.mockReset();
});

function mockOk(body: unknown = { success: true, message: 'ok' }) {
  mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => body });
}
function mockErr(status: number) {
  mockFetch.mockResolvedValueOnce({ ok: false, status, json: async () => ({}) });
}

describe('adminForgotPassword', () => {
  it('POSTs phone to the forgot endpoint', async () => {
    mockOk();
    await adminForgotPassword('+1234567890', 'https://api.test');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/password/forgot'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ phone: '+1234567890' }) }),
    );
  });

  it('throws on invalid phone (400)', async () => {
    mockErr(400);
    await expect(adminForgotPassword('bad', 'https://api.test')).rejects.toThrow('Invalid phone number.');
  });
});

describe('adminVerifyResetOtp', () => {
  it('returns the resetToken on success', async () => {
    mockOk({ resetToken: 'tok-123' });
    const token = await adminVerifyResetOtp('+1234567890', '123456', 'https://api.test');
    expect(token).toBe('tok-123');
  });

  it('throws on wrong code (400)', async () => {
    mockErr(400);
    await expect(adminVerifyResetOtp('+1234567890', '000000', 'https://api.test')).rejects.toThrow(
      'Invalid or expired code.',
    );
  });
});

describe('adminResetPassword', () => {
  it('POSTs token and new password', async () => {
    mockOk();
    await adminResetPassword('tok-123', 'newpass12', 'https://api.test');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/password/reset'),
      expect.objectContaining({ body: JSON.stringify({ resetToken: 'tok-123', newPassword: 'newpass12' }) }),
    );
  });

  it('throws an expired-session message on 401', async () => {
    mockErr(401);
    await expect(adminResetPassword('expired', 'newpass12', 'https://api.test')).rejects.toThrow(
      'Reset session expired. Please start again.',
    );
  });

  it('throws a weak-password message on 400', async () => {
    mockErr(400);
    await expect(adminResetPassword('tok-123', 'short', 'https://api.test')).rejects.toThrow(
      'Password does not meet requirements.',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `wsl bash -lic "cd ~/projects/dragon-ecosystem/apps/admin && pnpm test admin-auth.reset"`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Add the implementation**

In `apps/admin/features/auth/admin-auth.api.ts`, add an import for the response type (the SDK does not re-export it):

```ts
import type { AuthGenericResponse, VerifyResetOtpResponse } from '@dragon/types';
```

Append at the end of the file:

```ts
export async function adminForgotPassword(phone: string, apiBaseUrl: string): Promise<void> {
  const client = createApiClient({ baseUrl: apiBaseUrl });
  try {
    await client.request<AuthGenericResponse>({
      method: 'POST',
      path: '/api/v1/auth/password/forgot',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 400) {
      throw new Error('Invalid phone number.');
    }
    throw new Error('Could not send reset code. Please try again.');
  }
}

export async function adminVerifyResetOtp(
  phone: string,
  code: string,
  apiBaseUrl: string,
): Promise<string> {
  const client = createApiClient({ baseUrl: apiBaseUrl });
  try {
    const response = await client.request<VerifyResetOtpResponse>({
      method: 'POST',
      path: '/api/v1/auth/password/verify-reset-otp',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    return response.resetToken;
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 400) {
      throw new Error('Invalid or expired code.');
    }
    throw new Error('Could not verify code. Please try again.');
  }
}

export async function adminResetPassword(
  resetToken: string,
  newPassword: string,
  apiBaseUrl: string,
): Promise<void> {
  const client = createApiClient({ baseUrl: apiBaseUrl });
  try {
    await client.request<AuthGenericResponse>({
      method: 'POST',
      path: '/api/v1/auth/password/reset',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword }),
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      throw new Error('Reset session expired. Please start again.');
    }
    if (error instanceof ApiClientError && error.status === 400) {
      throw new Error('Password does not meet requirements.');
    }
    throw new Error('Could not reset password. Please try again.');
  }
}
```

Note: `createApiClient` and `ApiClientError` are already imported at the top of `admin-auth.api.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `wsl bash -lic "cd ~/projects/dragon-ecosystem/apps/admin && pnpm test admin-auth.reset"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/features/auth/admin-auth.api.ts apps/admin/features/auth/admin-auth.reset.spec.ts
git commit -m "feat(admin): add password-reset API wrappers"
```

---

## Task 4: Admin forgot-password page + login link

**Files:**
- Create: `apps/admin/pages/forgot-password.vue`
- Modify: `apps/admin/pages/login.vue`

The page renders into the `default.vue` auth-card layout (brand + card supplied by the layout), exactly like `login.vue` — so the page emits only the heading + form, reusing the `.dr-input` / `.dr-btn dr-btn-primary` design-system classes and `login.vue`'s scoped styles.

- [ ] **Step 1: Create the page**

Create `apps/admin/pages/forgot-password.vue`:

```vue
<template>
  <div>
    <!-- Step 1: phone -->
    <template v-if="step === 'phone'">
      <h2 class="login-heading">بازیابی رمز عبور</h2>
      <p class="login-sub">شماره موبایل خود را وارد کنید تا کد تأیید ارسال شود</p>
      <form class="login-form" @submit.prevent="handleRequest">
        <div class="form-group">
          <label class="form-label" for="phone">شماره موبایل</label>
          <input id="phone" v-model="phone" class="dr-input" type="tel" autocomplete="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" :disabled="loading" required />
        </div>
        <div v-if="errorMessage" class="error-alert" role="alert">{{ errorMessage }}</div>
        <button class="dr-btn dr-btn-primary submit-btn" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner" />
          {{ loading ? 'در حال ارسال…' : 'ارسال کد' }}
        </button>
        <NuxtLink to="/login" class="back-link">بازگشت به ورود</NuxtLink>
      </form>
    </template>

    <!-- Step 2: otp -->
    <template v-else-if="step === 'otp'">
      <h2 class="login-heading">تأیید کد</h2>
      <p class="login-sub">کد ارسال‌شده به {{ phone }} را وارد کنید</p>
      <form class="login-form" @submit.prevent="handleVerify">
        <div class="form-group">
          <label class="form-label" for="code">کد تأیید</label>
          <input id="code" v-model="otpCode" class="dr-input otp-input" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="_ _ _ _ _ _" dir="ltr" maxlength="6" :disabled="loading" required />
        </div>
        <div v-if="errorMessage" class="error-alert" role="alert">{{ errorMessage }}</div>
        <button class="dr-btn dr-btn-primary submit-btn" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner" />
          {{ loading ? 'در حال تأیید…' : 'تأیید کد' }}
        </button>
        <button type="button" class="back-link" :disabled="loading" @click="goToPhoneStep">تغییر شماره موبایل</button>
      </form>
    </template>

    <!-- Step 3: reset -->
    <template v-else>
      <h2 class="login-heading">رمز عبور جدید</h2>
      <p class="login-sub">رمز عبور تازه‌ای انتخاب کنید</p>
      <form class="login-form" @submit.prevent="handleReset">
        <div class="form-group">
          <label class="form-label" for="password">رمز عبور جدید</label>
          <input id="password" v-model="password" class="dr-input" type="password" autocomplete="new-password" placeholder="حداقل ۸ کاراکتر" dir="ltr" :disabled="loading" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="confirm">تکرار رمز عبور</label>
          <input id="confirm" v-model="confirmPassword" class="dr-input" type="password" autocomplete="new-password" placeholder="••••••••" dir="ltr" :disabled="loading" required />
        </div>
        <div v-if="errorMessage" class="error-alert" role="alert">{{ errorMessage }}</div>
        <button class="dr-btn dr-btn-primary submit-btn" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner" />
          {{ loading ? 'در حال ذخیره…' : 'تغییر رمز عبور' }}
        </button>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { adminForgotPassword, adminVerifyResetOtp, adminResetPassword } from '~/features/auth/admin-auth.api';

const router = useRouter();
const {
  public: { apiBaseUrl },
} = useRuntimeConfig();

const step = ref<'phone' | 'otp' | 'reset'>('phone');
const phone = ref('');
const otpCode = ref('');
const resetToken = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');

function goToPhoneStep() {
  step.value = 'phone';
  errorMessage.value = '';
}

async function handleRequest() {
  if (loading.value) return;
  errorMessage.value = '';
  loading.value = true;
  try {
    await adminForgotPassword(phone.value.trim(), String(apiBaseUrl));
    step.value = 'otp';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not send reset code.';
  } finally {
    loading.value = false;
  }
}

async function handleVerify() {
  if (loading.value) return;
  errorMessage.value = '';
  loading.value = true;
  try {
    resetToken.value = await adminVerifyResetOtp(phone.value.trim(), otpCode.value.trim(), String(apiBaseUrl));
    step.value = 'reset';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not verify code.';
  } finally {
    loading.value = false;
  }
}

async function handleReset() {
  if (loading.value) return;
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
    await adminResetPassword(resetToken.value, password.value, String(apiBaseUrl));
    await router.push('/login?reset=success');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not reset password.';
    if (errorMessage.value.includes('Reset session expired')) {
      step.value = 'phone';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-heading { font-size: var(--text-h3-size); font-weight: var(--weight-bold); color: var(--text-primary); margin: 0 0 6px; letter-spacing: var(--text-h3-tracking); }
.login-sub { font-size: 14px; color: var(--text-muted); margin: 0 0 28px; }
.login-form { display: flex; flex-direction: column; gap: 18px; }
.form-group { display: flex; flex-direction: column; gap: 7px; }
.form-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
.otp-input { text-align: center; font-size: 22px; letter-spacing: 0.25em; }
.error-alert { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: var(--radius-md); background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25); color: var(--danger-400); font-size: 13px; }
.submit-btn { width: 100%; justify-content: center; height: 46px; font-size: 15px; border-radius: var(--radius-md); margin-top: 4px; }
.submit-btn:disabled { opacity: var(--opacity-disabled); cursor: not-allowed; }
.spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: #fff; animation: dr-spin 0.8s linear infinite; }
.back-link { background: none; border: none; color: var(--text-muted); font-size: 13px; cursor: pointer; padding: 6px; border-radius: var(--radius-sm); text-align: center; text-decoration: none; transition: color var(--motion-fast) var(--ease-out); }
.back-link:hover:not(:disabled) { color: var(--text-secondary); }
</style>
```

- [ ] **Step 2: Add the forgot-password link to admin login.vue**

In `apps/admin/pages/login.vue`, after the error-alert block (`</div>` that closes `error-alert`, line 53) and before the submit button, insert:

```html
      <NuxtLink to="/forgot-password" class="forgot-link">رمز عبور را فراموش کرده‌اید؟</NuxtLink>
```

Add to its `<style scoped>`:

```css
.forgot-link { font-size: 13px; color: var(--purple-300); text-decoration: none; align-self: flex-start; }
.forgot-link:hover { color: var(--purple-200); }
```

- [ ] **Step 3: Type-check sanity**

Run: `wsl bash -lic "cd ~/projects/dragon-ecosystem/apps/admin && pnpm exec nuxi typecheck"`
Expected: No errors referencing the new page or `login.vue`. (Skip if no typecheck script; covered by Task 5.)

- [ ] **Step 4: Commit**

```bash
git add apps/admin/pages/forgot-password.vue apps/admin/pages/login.vue
git commit -m "feat(admin): add forgot-password page and login link"
```

---

## Task 5: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Start the API + dev seed**

The dev seed (`phase1-dev-seed.service.ts`) provisions test users/admins. Start the API and both apps per the repo README (e.g. `wsl bash -lic "cd ~/projects/dragon-ecosystem && pnpm dev"` or the per-app dev scripts).

- [ ] **Step 2: Web happy path**

Go to web `/login` → click "رمز عبور را فراموش کرده‌اید؟" → `/forgot-password`. Enter a seeded user's phone → submit. The mock SMS provider logs the OTP code to the API console (`MockSmsProvider`). Read it, enter it → set a new password (≥ 8 chars, matching confirm) → expect redirect to `/login?reset=success`. Log in with the new password to confirm.

- [ ] **Step 3: Web error paths**

Verify: wrong OTP → "کد تأیید اشتباه یا منقضی شده است."; password < 8 chars → length error (no API call); mismatched confirm → mismatch error.

- [ ] **Step 4: Admin happy path + errors**

Repeat Steps 2–3 in the admin app `/login` → `/forgot-password`, using a seeded admin account. Confirm redirect to `/login?reset=success` and that the new password logs into the admin console. Confirm the admin API error strings appear in English (`Invalid or expired code.` etc.), per the existing admin-auth pattern.

- [ ] **Step 5: Confirm session revocation**

After a successful reset, confirm any prior session for that account is rejected on its next refresh (the backend `resetPassword` calls `revokeAllForUser(..., 'password_reset')`). Spot-check by leaving a second logged-in session open before reset and observing it gets logged out on next token refresh.

- [ ] **Step 6: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "fix: address password-reset frontend verification findings"
```

---

## Self-Review

- **Spec coverage:** §Architecture (single multi-step page) → Tasks 2, 4. §Files web → Tasks 1, 2; admin → Tasks 3, 4. §Data flow (phone→otp→reset, validation, change-phone) → Tasks 2, 4 page scripts. §Error handling table → Tasks 1, 3 (status mapping) + page bounce-to-phone on 401. §Testing (admin + web API specs, manual) → Tasks 1, 3, 5. §Public-route check → reference facts + Task 5. All spec sections mapped.
- **Type consistency:** `webForgotPassword(phone, apiBaseUrl)`, `webVerifyResetOtp(phone, code, apiBaseUrl): Promise<string>`, `webResetPassword(resetToken, newPassword, apiBaseUrl)` — used identically in the page and tests. Admin trio mirrors with the same signatures. Response type `VerifyResetOtpResponse` (`{ resetToken }`) imported from `@dragon/types` in both apps. Request bodies match the contracts (`{ phone }`, `{ phone, code }`, `{ resetToken, newPassword }`).
- **Placeholder scan:** No TBD/TODO; all code blocks complete; styles included verbatim.
