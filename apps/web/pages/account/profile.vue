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

      <div class="avatar-section">
        <ProfileAvatar
          :avatar-url="profile.avatarUrl"
          :display-name="profile.displayName"
          :username="profile.username"
          class="avatar-large"
        />
        <div class="avatar-actions">
          <label
            class="avatar-upload-btn"
            :class="{ 'avatar-upload-btn--loading': avatarState === 'uploading' }"
          >
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="avatar-file-input"
              :disabled="avatarState === 'uploading'"
              @change="onAvatarFileChange"
            />
            {{ avatarState === 'uploading' ? 'Uploading…' : 'Change avatar' }}
          </label>
          <button
            v-if="profile.avatarUrl"
            class="avatar-remove-btn"
            :disabled="avatarState === 'uploading'"
            @click="removeAvatar"
          >
            Remove
          </button>
        </div>
        <p v-if="avatarState === 'error'" class="avatar-error" role="alert">{{ avatarError }}</p>
      </div>

      <ProfileEditForm
        :profile="profile"
        :submitting="saveState === 'saving'"
        @submit="saveProfile"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import type { MyUserProfileDto, UpdateMyProfileDto } from '../../features/profile/profile.types';

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
const avatarState = ref<'idle' | 'uploading' | 'error'>('idle');
const avatarError = ref('');
const avatarInputRef = ref<HTMLInputElement | null>(null);

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

async function onAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  avatarState.value = 'uploading';
  avatarError.value = '';

  try {
    profile.value = await profileApi.value.uploadAvatar(file);
    avatarState.value = 'idle';
  } catch (err) {
    avatarError.value = err instanceof Error ? err.message : 'Avatar upload failed.';
    avatarState.value = 'error';
  } finally {
    if (avatarInputRef.value) avatarInputRef.value.value = '';
  }
}

async function removeAvatar() {
  avatarState.value = 'uploading';
  avatarError.value = '';

  try {
    profile.value = await profileApi.value.deleteAvatar();
    avatarState.value = 'idle';
  } catch (err) {
    avatarError.value = err instanceof Error ? err.message : 'Could not remove avatar.';
    avatarState.value = 'error';
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

.avatar-section {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.avatar-large {
  width: 5rem;
  height: 5rem;
}

.avatar-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.avatar-file-input {
  display: none;
}

.avatar-upload-btn {
  display: inline-block;
  padding: 0.45rem 1rem;
  border: 1px solid var(--glass-border-strong);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--purple-300);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}

.avatar-upload-btn:hover:not(.avatar-upload-btn--loading) {
  background: rgba(109, 40, 217, 0.1);
}

.avatar-upload-btn--loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.avatar-remove-btn {
  padding: 0.45rem 1rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--danger-400);
  font-size: 0.875rem;
  cursor: pointer;
}

.avatar-remove-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.08);
}

.avatar-remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.avatar-error {
  font-size: 0.8rem;
  color: var(--danger-400);
  margin: 0;
  width: 100%;
}
</style>
