<template>
  <article class="public-profile-card">
    <ProfileAvatar
      :avatar-url="profile.avatarUrl"
      :display-name="profile.displayName"
      :username="profile.username"
    />
    <div>
      <div class="public-profile-card__header">
        <h1>{{ profile.displayName }}</h1>
        <ProfileVisibilityBadge :visibility="profile.visibility" />
      </div>
      <p class="public-profile-card__username">@{{ profile.username }}</p>
      <p v-if="profile.bio" class="public-profile-card__bio">{{ profile.bio }}</p>
      <p class="public-profile-card__url">{{ profile.publicUrl }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { PublicUserProfileDto } from '../../features/profile/profile.types';

defineProps<{
  profile: PublicUserProfileDto;
}>();
</script>

<style scoped>
.public-profile-card {
  border: 1px solid var(--glass-border-strong);
  border-radius: 1rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: auto 1fr;
  margin: 2rem auto;
  max-width: 48rem;
  padding: 1.5rem;
  background: var(--surface-card);
}

.public-profile-card__header {
  align-items: center;
  display: flex;
  gap: 0.75rem;
}

.public-profile-card__username,
.public-profile-card__url {
  color: var(--text-muted);
}

.public-profile-card__bio {
  line-height: 1.6;
  color: var(--text-secondary);
}
</style>
