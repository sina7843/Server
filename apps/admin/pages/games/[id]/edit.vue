<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/games" class="back-link">← بازی‌ها</NuxtLink>
      <h1 class="page-title">ویرایش بازی</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.TOURNAMENT_GAME_MANAGE)" />

    <LoadingState v-else-if="gameLoading" />

    <ErrorState v-else-if="gameError" :message="gameError" @retry="reload" />

    <template v-else-if="game">
      <GameForm
        :initial="game"
        :edit-mode="true"
        submit-label="ذخیره تغییرات"
        :action-loading="actionLoading"
        :action-error="actionError"
        @submit="onSubmit"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';
import type { GameStatus } from '@dragon/types';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.TOURNAMENT_GAME_MANAGE,
});
useHead({ title: 'ویرایش بازی — Dragon Admin' });

const route = useRoute();
const router = useRouter();
const { hasPermission } = useAdminPermissions();
const { game, gameLoading, gameError, loadGame, updateGame, actionLoading, actionError } =
  useAdminGames();

const gameId = String(route.params['id']);

async function reload() {
  await loadGame(gameId);
}

async function onSubmit(data: {
  name: string;
  slug: string;
  status: GameStatus;
  description?: string;
}) {
  const updated = await updateGame(gameId, data);
  if (updated) {
    await router.push('/games');
  }
}

onMounted(() => {
  if (hasPermission(Permissions.TOURNAMENT_GAME_MANAGE)) {
    void loadGame(gameId);
  }
});
</script>

<style scoped>
.page {
  max-width: 540px;
}

.page-header {
  margin-block-end: 1.25rem;
}

.back-link {
  font-size: 0.85rem;
  color: #3b82f6;
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
  color: #1e293b;
}
</style>
