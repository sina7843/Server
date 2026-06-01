<template>
  <main class="my-registration-page">
    <h1>My Registration</h1>

    <AuthRequiredState v-if="state.status === 'auth_required'" />
    <div v-else-if="state.status === 'loading'" class="page-loading" role="status">Loading…</div>
    <p v-else-if="state.status === 'not_found'" class="not-found-message" role="status">
      You have not registered for this tournament.
      <a href="register">Register now</a>
    </p>
    <p v-else-if="state.status === 'withdrawn'" class="withdrawn-message" role="status">
      Your registration has been withdrawn.
    </p>
    <p v-else-if="state.status === 'error'" class="page-error" role="alert">
      {{ state.message }}
    </p>

    <template v-else-if="state.status === 'ready'">
      <EditRegistrationForm
        v-if="showEditForm"
        :registration="state.registration"
        :submitting="editSubmitting"
        @submit="handleEditSubmit"
        @cancel="showEditForm = false"
      />
      <MyRegistrationPanel
        v-else
        :registration="state.registration"
        @edit="showEditForm = true"
        @withdraw="openWithdrawDialog"
      />
    </template>

    <WithdrawConfirmDialog
      v-if="showWithdrawDialog"
      :submitting="withdrawing"
      @confirm="confirmWithdraw"
      @cancel="showWithdrawDialog = false"
    />
  </main>
</template>

<script setup lang="ts">
import type { MyTournamentRegistrationDto, TeamRegistrationMemberDto } from '@dragon/types';
import type { MyRegistrationPageState } from '../../../features/registrations/registration.types';

definePageMeta({});

useHead({
  title: 'My Registration',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
});

const route = useRoute();
const slug = route.params.slug as string;
const registrationApi = useRegistration();
const { hasToken } = useAuthToken();

const state = ref<MyRegistrationPageState>({ status: 'loading' });
const showWithdrawDialog = ref(false);
const withdrawing = ref(false);
const showEditForm = ref(false);
const editSubmitting = ref(false);

async function load() {
  if (!hasToken.value) {
    state.value = { status: 'auth_required' };
    return;
  }

  try {
    const registration = await registrationApi.value.getMyRegistration(slug);
    state.value = { status: 'ready', registration };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('401')) {
      state.value = { status: 'auth_required' };
    } else if (msg.includes('404')) {
      state.value = { status: 'not_found' };
    } else {
      state.value = { status: 'error', message: msg || 'Failed to load your registration.' };
    }
  }
}

function openWithdrawDialog() {
  showWithdrawDialog.value = true;
}

async function confirmWithdraw() {
  withdrawing.value = true;

  try {
    await registrationApi.value.withdrawMyRegistration(slug);
    showWithdrawDialog.value = false;
    state.value = { status: 'withdrawn' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    showWithdrawDialog.value = false;
    state.value = { status: 'error', message: msg || 'Failed to withdraw registration.' };
  } finally {
    withdrawing.value = false;
  }
}

async function handleEditSubmit(input: {
  teamName: string;
  members: readonly TeamRegistrationMemberDto[];
}) {
  editSubmitting.value = true;

  try {
    const updated = await registrationApi.value.updateMyRegistration(slug, input);
    showEditForm.value = false;
    state.value = { status: 'ready', registration: updated };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    showEditForm.value = false;
    state.value = { status: 'error', message: msg || 'Failed to update registration.' };
  } finally {
    editSubmitting.value = false;
  }
}

await load();
</script>

<style scoped>
.my-registration-page {
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

.not-found-message,
.withdrawn-message {
  padding: 1.5rem;
  text-align: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  color: #6b7280;
}

.not-found-message a {
  display: block;
  margin-top: 0.75rem;
  color: #2563eb;
  font-weight: 500;
}

.page-error {
  color: #dc2626;
  text-align: center;
}
</style>
