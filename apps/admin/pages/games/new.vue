<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/games" class="back-link">← بازی‌ها</NuxtLink>
      <h1 class="page-title">بازی جدید</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.TOURNAMENT_GAME_MANAGE)" />

    <template v-else>
      <GameForm
        submit-label="ایجاد بازی"
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
useHead({ title: 'بازی جدید — Dragon Admin' });

const router = useRouter();
const { hasPermission } = useAdminPermissions();
const { createGame, actionLoading, actionError } = useAdminGames();

async function onSubmit(data: {
  name: string;
  slug: string;
  status: GameStatus;
  description?: string;
  coverMediaId?: string | null;
  iconMediaId?: string | null;
}) {
  const created = await createGame(data);
  if (created) {
    await router.push('/games');
  }
}
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
