<template>
  <main>
    <ProfileStateMessage v-if="pageState.status === 'loading'" state="loading" />
    <PublicProfileCard v-else-if="pageState.status === 'public'" :profile="pageState.profile" />
    <ProfileStateMessage v-else-if="pageState.status === 'private'" state="private" />
    <ProfileStateMessage v-else-if="pageState.status === 'not_found'" state="not_found" />
    <ProfileStateMessage v-else state="error" :message="pageState.message" />
  </main>
</template>

<script setup lang="ts">
import type { PublicProfilePageState } from '../../features/profile/profile.types';

const route = useRoute();
const profileApi = useProfile();

const username = computed(() => String(route.params.username ?? ''));
const pageState = ref<PublicProfilePageState>({ status: 'loading' });

async function loadProfile() {
  pageState.value = { status: 'loading' };

  try {
    const response = await profileApi.value.getPublicProfile(username.value);

    if ('state' in response) {
      pageState.value = { status: response.state };
      return;
    }

    pageState.value = { status: 'public', profile: response };
  } catch {
    pageState.value = {
      status: 'error',
      message: 'Unable to load this profile.',
    };
  }
}

await loadProfile();

useHead(() => {
  const noindex = pageState.value.status !== 'public';

  return {
    title:
      pageState.value.status === 'public'
        ? `${pageState.value.profile.displayName} (@${pageState.value.profile.username})`
        : 'Profile',
    meta: [
      {
        name: 'robots',
        content: noindex ? 'noindex,nofollow' : 'index,follow',
      },
      ...(pageState.value.status === 'public' && pageState.value.profile.bio
        ? [
            {
              name: 'description',
              content: pageState.value.profile.bio,
            },
          ]
        : []),
    ],
  };
});
</script>
