<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink :to="`/tournaments/${tournamentId}`" class="back-link">← جزئیات تورنمنت</NuxtLink>
      <h1 class="page-title">ویرایش تورنمنت</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.TOURNAMENT_UPDATE)" />

    <LoadingState v-else-if="tournamentLoading" />

    <ErrorState v-else-if="tournamentError" :message="tournamentError" @retry="reload" />

    <template v-else-if="tournament">
      <TournamentForm
        :initial="tournament"
        :edit-mode="true"
        submit-label="ذخیره تغییرات"
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
import type { UpdateTournamentInput } from '~/features/tournaments/admin-tournaments.api';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.TOURNAMENT_UPDATE,
});
useHead({ title: 'ویرایش تورنمنت — Dragon Admin' });

const route = useRoute();
const router = useRouter();
const { hasPermission } = useAdminPermissions();
const {
  tournament,
  tournamentLoading,
  tournamentError,
  loadTournament,
  updateTournament,
  actionLoading,
  actionError,
  gamesForSelector,
  gamesForSelectorLoading,
  loadGamesForSelector,
} = useAdminTournaments();

const tournamentId = String(route.params['id']);

async function reload() {
  await loadTournament(tournamentId);
}

async function onSubmit(data: UpdateTournamentInput) {
  const updated = await updateTournament(tournamentId, data);
  if (updated) {
    await router.push(`/tournaments/${tournamentId}`);
  }
}

onMounted(() => {
  if (hasPermission(Permissions.TOURNAMENT_UPDATE)) {
    void loadTournament(tournamentId);
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
