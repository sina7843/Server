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
        <div class="filter-pills">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            class="pill"
            :class="{ 'pill--active': statusFilter === opt.value }"
            type="button"
            @click="setStatus(opt.value)"
          >{{ opt.label }}</button>
        </div>
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

const statusOptions = [
  { value: '', label: 'همه' },
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'غیرفعال' },
  { value: 'archived', label: 'بایگانی' },
];

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

function setStatus(val: string) {
  statusFilter.value = val;
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
  gap: 16px;
  margin-block-end: 24px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.new-btn {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 16px;
  background: var(--purple-500);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  text-decoration: none;
  box-shadow: 0 8px 24px -8px rgba(109, 40, 217, 0.5);
  transition: all var(--motion-fast);
}

.new-btn:hover {
  background: var(--purple-400);
  box-shadow: 0 12px 32px -8px rgba(109, 40, 217, 0.7);
}

.filters {
  margin-block-end: 16px;
}

.filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pill {
  height: 32px;
  padding: 0 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--motion-fast);
}

.pill:hover {
  background: var(--hover-overlay);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.pill--active {
  background: rgba(109, 40, 217, 0.15);
  color: var(--purple-300);
  border-color: rgba(109, 40, 217, 0.4);
  font-weight: 600;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-block-start: 16px;
  justify-content: flex-end;
}

.page-btn {
  height: 32px;
  padding: 0 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: var(--input-bg);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all var(--motion-fast);
}

.page-btn:not(:disabled):hover {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
</style>
