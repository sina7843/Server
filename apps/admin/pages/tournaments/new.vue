<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/tournaments" class="back-link">← تورنمنت‌ها</NuxtLink>
      <h1 class="page-title">تورنمنت جدید</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.TOURNAMENT_CREATE)" />

    <template v-else>
      <TournamentForm
        submit-label="ایجاد تورنمنت"
        :games="gamesForSelector"
        :games-loading="gamesForSelectorLoading"
        :action-loading="actionLoading"
        :action-error="actionError"
        @submit="onSubmit"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';
import type { CreateTournamentInput } from '~/features/tournaments/admin-tournaments.api';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.TOURNAMENT_CREATE,
});
useHead({ title: 'تورنمنت جدید — Dragon Admin' });

const router = useRouter();
const { hasPermission } = useAdminPermissions();
const {
  createTournament,
  actionLoading,
  actionError,
  gamesForSelector,
  gamesForSelectorLoading,
  loadGamesForSelector,
} = useAdminTournaments();

async function onSubmit(data: CreateTournamentInput) {
  const created = await createTournament(data);
  if (created) {
    await router.push(`/tournaments/${created.id}`);
  }
}

onMounted(() => {
  if (hasPermission(Permissions.TOURNAMENT_CREATE)) {
    void loadGamesForSelector();
  }
});
</script>

<style scoped>
.page {
  max-width: 600px;
}

.page-header {
  margin-block-end: 1.25rem;
}

.back-link {
  font-size: 0.85rem;
  color: var(--purple-400);
  text-decoration: none;
  display: inline-block;
  margin-block-end: 0.4rem;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}
</style>
