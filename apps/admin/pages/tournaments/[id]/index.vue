<template>
  <div class="page">
    <TournamentNavBar />

    <ForbiddenState v-if="!hasPermission(Permissions.TOURNAMENT_READ)" />

    <LoadingState v-else-if="tournamentLoading" />

    <ErrorState v-else-if="tournamentError" :message="tournamentError" @retry="reload" />

    <template v-else-if="tournament">
      <TournamentOperationalHub
        :tournament="tournament"
        :action-loading="actionLoading"
        :action-error="actionError"
        @lifecycle-action="onLifecycleAction"
        @delete="onDeleteRequest"
      />
    </template>

    <ConfirmDialog
      :open="deleteDialogOpen"
      title="حذف تورنمنت"
      :description="`آیا مطمئن هستید که می‌خواهید تورنمنت «${tournament?.title ?? ''}» را حذف کنید؟`"
      confirm-label="حذف"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onDeleteConfirm"
      @cancel="deleteDialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.TOURNAMENT_READ,
});
useHead({ title: 'جزئیات تورنمنت — Dragon Admin' });

const route = useRoute();
const router = useRouter();
const { hasPermission } = useAdminPermissions();
const {
  tournament,
  tournamentLoading,
  tournamentError,
  loadTournament,
  publishTournament,
  openRegistration,
  closeRegistration,
  startTournament,
  completeTournament,
  cancelTournament,
  archiveTournament,
  deleteTournament,
  actionLoading,
  actionError,
} = useAdminTournaments();

const tournamentId = String(route.params['id']);
const deleteDialogOpen = ref(false);

type LifecycleAction =
  | 'publish'
  | 'openRegistration'
  | 'closeRegistration'
  | 'start'
  | 'complete'
  | 'cancel'
  | 'archive';

async function reload() {
  await loadTournament(tournamentId);
}

async function onLifecycleAction(action: LifecycleAction) {
  const actionMap: Record<LifecycleAction, () => Promise<boolean>> = {
    publish: () => publishTournament(tournamentId),
    openRegistration: () => openRegistration(tournamentId),
    closeRegistration: () => closeRegistration(tournamentId),
    start: () => startTournament(tournamentId),
    complete: () => completeTournament(tournamentId),
    cancel: () => cancelTournament(tournamentId),
    archive: () => archiveTournament(tournamentId),
  };

  await actionMap[action]();
}

function onDeleteRequest() {
  deleteDialogOpen.value = true;
}

async function onDeleteConfirm() {
  const ok = await deleteTournament(tournamentId);
  if (ok) {
    deleteDialogOpen.value = false;
    await router.push('/tournaments');
  }
}

onMounted(() => {
  if (hasPermission(Permissions.TOURNAMENT_READ)) {
    void loadTournament(tournamentId);
  }
});
</script>

<style scoped>
.page {
  max-width: 900px;
}
</style>
