<template>
  <main class="account-profile-page">
    <h1>Profile</h1>

    <ProfileStateMessage v-if="state === 'loading'" state="loading" />
    <ProfileStateMessage
      v-else-if="state === 'unauthorized'"
      state="error"
      message="Your session has expired. Please sign in again."
    />
    <ProfileStateMessage
      v-else-if="state === 'error'"
      state="error"
      message="Unable to load your profile."
    />

    <section v-else-if="profile">
      <p v-if="saveState === 'saved'" role="status">Profile saved.</p>
      <p v-if="saveState === 'error'" role="alert">Profile could not be saved.</p>
      <ProfileEditForm
        :profile="profile"
        :submitting="saveState === 'saving'"
        @submit="saveProfile"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import type {
  MyUserProfileDto,
  UpdateMyProfileDto,
} from '../../features/profile/profile.types';

definePageMeta({
  middleware: 'auth-required',
});

useHead({
  title: 'Account profile',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
});

const profileApi = useProfile();
const profile = ref<MyUserProfileDto | null>(null);
const state = ref<'loading' | 'ready' | 'unauthorized' | 'error'>('loading');
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle');

async function loadProfile() {
  try {
    profile.value = await profileApi.value.getMyProfile();
    state.value = 'ready';
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    state.value = message.includes('401') ? 'unauthorized' : 'error';
  }
}

async function saveProfile(payload: UpdateMyProfileDto) {
  saveState.value = 'saving';

  try {
    profile.value = await profileApi.value.updateMyProfile(payload);
    saveState.value = 'saved';
  } catch {
    saveState.value = 'error';
  }
}

await loadProfile();
</script>

<style scoped>
.account-profile-page {
  display: grid;
  gap: 1.5rem;
  margin: 2rem auto;
  max-width: 48rem;
}
</style>
