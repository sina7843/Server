<template>
  <div class="profile-avatar" :aria-label="label">
    <img v-if="avatarUrl" :src="avatarUrl" :alt="label" class="profile-avatar__img" />
    <span v-else class="profile-avatar__fallback">
      {{ initials }}
    </span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  }>(),
  {
    displayName: '',
    username: '',
    avatarUrl: undefined,
  },
);

const label = computed(() => `${props.displayName || props.username} avatar`);
const initials = computed(() => {
  const source = props.displayName || props.username || 'U';

  return source
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
});
</script>

<style scoped>
.profile-avatar {
  align-items: center;
  border: 1px solid #d4d4d8;
  border-radius: 999px;
  display: inline-flex;
  height: 4rem;
  justify-content: center;
  overflow: hidden;
  width: 4rem;
}

.profile-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar__fallback {
  font-weight: 700;
}
</style>
