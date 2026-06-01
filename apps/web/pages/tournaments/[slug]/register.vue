<template>
  <main class="tournament-register-page">
    <h1>Tournament Registration</h1>

    <AuthRequiredState v-if="state.status === 'auth_required'" />
    <div v-else-if="state.status === 'loading'" class="page-loading" role="status">Loading…</div>
    <p v-else-if="state.status === 'not_found'" class="page-error" role="alert">
      This tournament is not available.
    </p>
    <RegistrationClosedState v-else-if="state.status === 'closed'" />
    <CapacityFullState v-else-if="state.status === 'capacity_full'" />
    <AlreadyRegisteredState
      v-else-if="state.status === 'already_registered'"
      :registration="state.registration"
    />
    <SuccessState v-else-if="state.status === 'success'" :registration="state.registration" />
    <section v-else-if="state.status === 'open'" class="register-section">
      <p v-if="state.tournamentTitle" class="tournament-name">{{ state.tournamentTitle }}</p>
      <RegistrationForm :submitting="submitting" @submit="handleRegister" />
      <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>
    </section>
    <p v-else-if="state.status === 'error'" class="page-error" role="alert">
      {{ state.message }}
    </p>
  </main>
</template>

<script setup lang="ts">
import type { TournamentRegistrationInputDto } from '@dragon/types';
import type { RegistrationPageState } from '../../../features/registrations/registration.types';

definePageMeta({});

useHead({
  title: 'Register',
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
      state.value = { status: 'error', message: 'Failed to load registration status.' };
    }
    return;
  }

  if (!context.registrationOpen) {
    state.value = { status: 'closed' };
    return;
  }

  // Tournament is confirmed publicly visible and registration is open.
  // A 404 from getMyRegistration now safely means "user has no registration yet".
  try {
    const existing = await registrationApi.value.getMyRegistration(slug);
    state.value = { status: 'already_registered', registration: existing };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('401')) {
      state.value = { status: 'auth_required' };
    } else if (msg.includes('404')) {
      state.value = { status: 'open', tournamentTitle: context.tournamentTitle };
    } else {
      state.value = { status: 'error', message: 'Failed to load registration status.' };
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
        state.value = { status: 'already_registered', registration: existing };
      } catch {
        submitError.value = 'You are already registered for this tournament.';
      }
    } else {
      submitError.value = msg || 'Registration failed. Please try again.';
    }
  } finally {
    submitting.value = false;
  }
}

await load();
</script>

<style scoped>
.tournament-register-page {
  display: grid;
  gap: 1.5rem;
  margin: 2rem auto;
  max-width: 40rem;
  padding: 0 1rem;
}

.page-loading {
  color: #6b7280;
  text-align: center;
  padding: 2rem;
}

.tournament-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: #374151;
}

.register-section {
  display: grid;
  gap: 1.25rem;
}

.submit-error {
  color: #dc2626;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  padding: 0.75rem 1rem;
  margin: 0;
}

.page-error {
  color: #dc2626;
  text-align: center;
}
</style>
