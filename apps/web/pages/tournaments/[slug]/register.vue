<template>
  <main class="reg-page">
    <!-- Header -->
    <div class="reg-page__header">
      <NuxtLink :to="`/tournaments/${slug}`" class="reg-page__back">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
        </svg>
        بازگشت به تورنمنت
      </NuxtLink>
      <h1 class="reg-page__title">ثبت‌نام در تورنمنت</h1>
      <p v-if="state.status === 'open' && state.tournamentTitle" class="reg-page__tournament-name">
        {{ state.tournamentTitle }}
      </p>
    </div>

    <!-- States -->
    <AuthRequiredState v-if="state.status === 'auth_required'" />

    <div v-else-if="state.status === 'loading'" class="reg-page__loading" role="status">
      <span class="reg-page__spinner" aria-hidden="true" />
      در حال بارگذاری...
    </div>

    <div v-else-if="state.status === 'not_found'" class="reg-page__state-box reg-page__state-box--error" role="alert">
      <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
      </svg>
      <p>این تورنمنت در دسترس نیست.</p>
    </div>

    <RegistrationClosedState v-else-if="state.status === 'closed'" />
    <CapacityFullState v-else-if="state.status === 'capacity_full'" />
    <AlreadyRegisteredState
      v-else-if="state.status === 'already_registered'"
      :registration="state.registration"
    />
    <SuccessState v-else-if="state.status === 'success'" :registration="state.registration" />

    <section v-else-if="state.status === 'open'" class="reg-page__form-section">
      <RegistrationForm :submitting="submitting" @submit="handleRegister" />
      <div v-if="submitError" class="reg-page__submit-error" role="alert">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
        </svg>
        {{ submitError }}
      </div>
    </section>

    <div v-else-if="state.status === 'error'" class="reg-page__state-box reg-page__state-box--error" role="alert">
      <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
      </svg>
      <p>{{ state.message }}</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { TournamentRegistrationInputDto } from '@dragon/types';
import type { RegistrationPageState } from '../../../features/registrations/registration.types';

definePageMeta({ ssr: false });

useHead({
  title: 'ثبت‌نام در تورنمنت',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
});

const route = useRoute();
const slug = route.params.slug as string;
const registrationApi = useRegistration();
const { hasToken } = useAuthToken();

const state = ref<RegistrationPageState>({ status: 'loading' });
const submitting = ref(false);
const submitError = ref('');

async function load() {
  if (!hasToken.value) {
    state.value = { status: 'auth_required' };
    return;
  }

  let context: { tournamentTitle: string; registrationOpen: boolean };
  try {
    context = await registrationApi.value.getRegistrationContext(slug);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('401')) {
      state.value = { status: 'auth_required' };
    } else if (msg.includes('404')) {
      state.value = { status: 'not_found' };
    } else {
      state.value = { status: 'error', message: 'خطا در بارگذاری وضعیت ثبت‌نام.' };
    }
    return;
  }

  if (!context.registrationOpen) {
    state.value = { status: 'closed' };
    return;
  }

  try {
    const existing = await registrationApi.value.getMyRegistration(slug);
    // Withdrawn/cancelled registrations can be re-submitted — treat as open.
    if (existing.status === 'withdrawn' || existing.status === 'cancelled') {
      state.value = { status: 'open', tournamentTitle: context.tournamentTitle };
    } else {
      state.value = { status: 'already_registered', registration: existing };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('401')) {
      state.value = { status: 'auth_required' };
    } else if (msg.includes('404')) {
      state.value = { status: 'open', tournamentTitle: context.tournamentTitle };
    } else {
      state.value = { status: 'error', message: 'خطا در بارگذاری وضعیت ثبت‌نام.' };
    }
  }
}

async function handleRegister(input: TournamentRegistrationInputDto) {
  submitting.value = true;
  submitError.value = '';

  try {
    const registration = await registrationApi.value.register(slug, input);
    state.value = { status: 'success', registration };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('404')) {
      state.value = { status: 'not_found' };
    } else if (msg.includes('422')) {
      state.value = { status: 'closed' };
    } else if (msg.toLowerCase().includes('capacity')) {
      state.value = { status: 'capacity_full' };
    } else if (msg.includes('409')) {
      try {
        const existing = await registrationApi.value.getMyRegistration(slug);
        if (existing.status === 'withdrawn' || existing.status === 'cancelled') {
          state.value = { status: 'open', tournamentTitle: '' };
        } else {
          state.value = { status: 'already_registered', registration: existing };
        }
      } catch {
        submitError.value = 'شما قبلاً در این تورنمنت ثبت‌نام کرده‌اید.';
      }
    } else {
      submitError.value = msg || 'ثبت‌نام ناموفق بود. لطفاً دوباره تلاش کنید.';
    }
  } finally {
    submitting.value = false;
  }
}

await load();
</script>

<style scoped>
.reg-page {
  display: grid;
  gap: 2rem;
  margin: 0 auto;
  max-width: 38rem;
  padding: 40px 24px 80px;
}

.reg-page__header {
  display: grid;
  gap: 6px;
}

.reg-page__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 13px;
  text-decoration: none;
  margin-bottom: 4px;
  transition: color 0.15s;
}

.reg-page__back:hover {
  color: var(--text-secondary);
}

.reg-page__title {
  margin: 0;
  font-size: var(--text-h3-size);
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-sans-fa);
}

.reg-page__tournament-name {
  margin: 0;
  font-size: var(--text-body-sm-size);
  color: var(--purple-300);
  font-family: var(--font-sans-fa);
}

.reg-page__loading {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  padding: 3rem 0;
  color: var(--text-muted);
  font-family: var(--font-sans-fa);
}

.reg-page__spinner {
  display: block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--glass-border-strong);
  border-top-color: var(--purple-400);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.reg-page__form-section {
  display: grid;
  gap: 1.25rem;
}

.reg-page__state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 2.5rem;
  text-align: center;
  border-radius: 0.75rem;
  border: 1px solid var(--glass-border-strong);
  background: var(--surface-elevated);
  font-family: var(--font-sans-fa);
}

.reg-page__state-box--error {
  border-color: rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.06);
  color: var(--danger-400);
}

.reg-page__state-box p {
  margin: 0;
  color: inherit;
}

.reg-page__submit-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--danger-400);
  font-size: 14px;
  font-family: var(--font-sans-fa);
}
</style>
