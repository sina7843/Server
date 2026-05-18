<template>
  <span class="profile-visibility-badge">
    {{ visibility === 'public' ? 'Public' : 'Private' }}
  </span>
</template>

<script setup lang="ts">
import type { ProfileVisibility } from '../../features/profile/profile.types';

defineProps<{
  visibility: ProfileVisibility;
}>();
</script>

<style scoped>
.profile-visibility-badge {
  border: 1px solid #d4d4d8;
  border-radius: 999px;
  font-size: 0.875rem;
  padding: 0.2rem 0.6rem;
}
</style>
