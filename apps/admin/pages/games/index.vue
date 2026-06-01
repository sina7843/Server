<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">مدیریت بازی‌ها</h1>
      <NuxtLink
        v-if="hasPermission(Permissions.TOURNAMENT_GAME_MANAGE)"
        to="/games/new"
        class="new-btn"
      >
        + بازی جدید
      </NuxtLink>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.TOURNAMENT_GAME_READ)" />

    <template v-else>
      <div class="filters">
        <select v-model="statusFilter" class="filter-select" @change="onFilterChange">
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
          <option value="archived">بایگانی</option>
        </select>
      </div>

      <LoadingState v-if="gamesLoading" />
      <ErrorState v-else-if="gamesError" :message="gamesError" @retry="load" />
      <EmptyState v-else-if="games.length === 0" label="هیچ بازی‌ای یافت نشد." />

      <template v-else>
        <GameListTable
          :games="games"
          :can-manage="hasPermission(Permissions.TOURNAMENT_GAME_MANAGE)"
          @edit="onEdit"
          @delete="onDeleteRequest"
        />

        <div class="pagination">
          <button
            class="page-btn"
            type="button"
            :disabled="gamesPage <= 1"
            @click="goToPage(gamesPage - 1)"
          >
            قبلی
          </button>
          <span class="page-info">صفحه {{ gamesPage }}</span>
          <button
            class="page-btn"
            type="button"
            :disabled="games.length < PAGE_LIMIT"
            @click="goToPage(gamesPage + 1)"
          >
            بعدی
          </button>
        </div>
      </template>
    </template>

    <ConfirmDialog
      :open="deleteDialogOpen"
      title="حذف بازی"
      :description="`آیا مطمئن هستید که می‌خواهید بازی «${pendingDeleteGame?.name ?? ''}» را حذف کنید؟ این بازی از فهرست‌های عمومی و مدیریتی حذف می‌شود.`"
      confirm-label="حذف"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onDeleteConfirm"
      @cancel="onDeleteCancel"
    />
  </div>
</template>

<script setup lang="ts">
import type { GameDto, GameStatus } from '@dragon/types';
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.TOURNAMENT_GAME_READ,
});
useHead({ title: 'مدیریت بازی‌ها — Dragon Admin' });

const PAGE_LIMIT = 20;

const router = useRouter();
const { hasPermission } = useAdminPermissions();
const {
  games,
  gamesPage,
  gamesLoading,
  gamesError,
  loadGames,
  deleteGame,
  actionLoading,
  actionError,
} = useAdminGames();

const statusFilter = ref('');
const deleteDialogOpen = ref(false);
const pendingDeleteGame = ref<GameDto | null>(null);

function buildParams(page = 1) {
  return {
    page,
    limit: PAGE_LIMIT,
    ...(statusFilter.value ? { status: statusFilter.value as GameStatus } : {}),
  };
}

async function load(page = 1) {
  await loadGames(buildParams(page));
}

function onFilterChange() {
  void load(1);
}

function goToPage(page: number) {
  void load(page);
}

function onEdit(id: string) {
  void router.push(`/games/${id}/edit`);
}

function onDeleteRequest(game: GameDto) {
  pendingDeleteGame.value = game;
  deleteDialogOpen.value = true;
}

async function onDeleteConfirm() {
  if (!pendingDeleteGame.value) return;
  const ok = await deleteGame(pendingDeleteGame.value.id);
  if (ok) {
    deleteDialogOpen.value = false;
    pendingDeleteGame.value = null;
  }
}

function onDeleteCancel() {
  deleteDialogOpen.value = false;
  pendingDeleteGame.value = null;
}

onMounted(() => {
  if (hasPermission(Permissions.TOURNAMENT_GAME_READ)) {
    void load();
  }
});
</script>

<style scoped>
.page {
  max-width: 1000px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 1.25rem;
}

.page-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.new-btn {
  padding: 0.45rem 1.1rem;
  background: #3b82f6;
  color: #fff;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
}

.new-btn:hover {
  background: #2563eb;
}

.filters {
  margin-block-end: 1.25rem;
}

.filter-select {
  padding: 0.4rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #374151;
  background: #fff;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-block-start: 1rem;
  justify-content: flex-end;
}

.page-btn {
  padding: 0.4rem 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  background: #fff;
  cursor: pointer;
  color: #334155;
  transition: background 0.15s;
}

.page-btn:not(:disabled):hover {
  background: #f1f5f9;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.85rem;
  color: #64748b;
}
</style>
