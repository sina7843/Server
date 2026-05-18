<template>
  <section class="profile-state-message">
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  state: 'loading' | 'private' | 'not_found' | 'error';
  message?: string;
}>();

const title = computed(() => {
  switch (props.state) {
    case 'loading':
      return 'Loading profile';
    case 'private':
      return 'This profile is private';
    case 'not_found':
      return 'Profile not found';
    case 'error':
      return 'Profile unavailable';
    default:
      return 'Profile';
  }
});

const message = computed(() => {
  if (props.message) {
    return props.message;
  }

  switch (props.state) {
    case 'loading':
      return 'Please wait while the profile loads.';
    case 'private':
      return 'This user has chosen not to show public profile details.';
    case 'not_found':
      return 'The requested profile could not be found.';
    case 'error':
      return 'Something went wrong while loading this profile.';
    default:
      return '';
  }
});
</script>

<style scoped>
.profile-state-message {
  margin: 2rem auto;
  max-width: 42rem;
  text-align: center;
}
</style>
