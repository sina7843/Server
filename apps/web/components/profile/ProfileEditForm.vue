<template>
  <form class="profile-edit-form" @submit.prevent="submit">
    <label>
      Username
      <input v-model="form.username" autocomplete="username" name="username" />
      <span v-if="errors.username">{{ errors.username }}</span>
    </label>

    <label>
      Display name
      <input v-model="form.displayName" name="displayName" />
      <span v-if="errors.displayName">{{ errors.displayName }}</span>
    </label>

    <label>
      Bio
      <textarea v-model="form.bio" name="bio" rows="4" />
      <span v-if="errors.bio">{{ errors.bio }}</span>
    </label>

    <label>
      Visibility
      <select v-model="form.visibility" name="visibility">
        <option value="public">Public</option>
        <option value="private">Private</option>
      </select>
      <span v-if="errors.visibility">{{ errors.visibility }}</span>
    </label>

    <label>
      Avatar media reference
      <input v-model="avatarMediaIdText" name="avatarMediaId" />
      <span v-if="errors.avatarMediaId">{{ errors.avatarMediaId }}</span>
    </label>

    <button type="submit" :disabled="submitting">
      {{ submitting ? 'Saving…' : 'Save profile' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import type { MyUserProfileDto, UpdateMyProfileDto } from '../../features/profile/profile.types';
import { validateProfileUpdate } from '../../features/profile/profile.validation';

const props = defineProps<{
  profile: MyUserProfileDto;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: UpdateMyProfileDto];
}>();

const form = reactive({
  username: props.profile.username,
  displayName: props.profile.displayName,
  bio: props.profile.bio ?? '',
  visibility: props.profile.visibility,
});

const avatarMediaIdText = ref(props.profile.avatarMediaId ?? '');
const errors = reactive<Record<string, string>>({});

function submit() {
  Object.keys(errors).forEach((key) => {
    delete errors[key];
  });

  const payload: UpdateMyProfileDto = {
    username: form.username,
    displayName: form.displayName,
    bio: form.bio,
    visibility: form.visibility,
    avatarMediaId: avatarMediaIdText.value || null,
  };

  const result = validateProfileUpdate({
    username: payload.username ?? '',
    displayName: payload.displayName ?? '',
    bio: payload.bio,
    visibility: payload.visibility ?? 'public',
    avatarMediaId: payload.avatarMediaId,
  });

  Object.assign(errors, result.errors);

  if (result.valid) {
    emit('submit', payload);
  }
}
</script>

<style scoped>
.profile-edit-form {
  display: grid;
  gap: 1rem;
  max-width: 40rem;
}

.profile-edit-form label {
  display: grid;
  gap: 0.35rem;
}

.profile-edit-form input,
.profile-edit-form select,
.profile-edit-form textarea {
  border: 1px solid #d4d4d8;
  border-radius: 0.5rem;
  padding: 0.65rem;
}

.profile-edit-form span {
  color: #b91c1c;
  font-size: 0.875rem;
}
</style>
