<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">مدیریت تورنمنت‌ها</h1>
      <NuxtLink
        v-if="hasPermission(Permissions.TOURNAMENT_CREATE)"
        to="/tournaments/new"
        class="new-btn"
      >
        + تورنمنت جدید
      </NuxtLink>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.TOURNAMENT_READ)" />

    <template v-else>
      <div class="filters">
        <select v-model="statusFilter" class="filter-select" @change="onFilterChange">
          <option value="">همه وضعیت‌ها</option>
          <option value="draft">پیش‌نویس</option>
          <option value="published">منتشرشده</option>
          <option value="registration_open">ثبت‌نام باز</option>
          <option value="registration_closed">ثبت‌نام بسته</option>
          <option value="in_progress">در جریان</option>
          <option value="completed">پایان‌یافته</option>
          <option value="cancelled">لغوشده</option>
          <option value="archived">بایگانی</option>
        </select>
        <select v-model="formatFilter" class="filter-select" @change="onFilterChange">
          <option value="">همه فرمت‌ها</option>
          <option value="single_elimination">حذفی ساده</option>
          <option value="round_robin">دوره‌ای</option>
          <option value="manual">دستی</option>
        </select>
      </div>

      <LoadingState v-if="tournamentsLoading" />
      <ErrorState v-else-if="tournamentsError" :message="tournamentsError" @retry="load" />
      <EmptyState v-else-if="tournaments.length === 0" label="هیچ تورنمنتی یافت نشد." />

      <template v-else>
        <TournamentListTable
          :tournaments="tournaments"
          :can-update="hasPermission(Permissions.TOURNAMENT_UPDATE)"
          :can-delete="hasPermission(Permissions.TOURNAMENT_ARCHIVE)"
          @delete="onDeleteRequest"
        />

        <div class="pagination">
          <button
            class="page-btn"
            type="button"
            :disabled="tournamentsPage <= 1"
            @click="goToPage(tournamentsPage - 1)"
          >
            قبلی
          </button>
          <span class="page-info">صفحه {{ tournamentsPage }}</span>
          <button
            class="page-btn"
            type="button"
            :disabled="tournaments.length < PAGE_LIMIT"
            @click="goToPage(tournamentsPage + 1)"
          >
            بعدی
          </button>
        </div>
      </template>
    </template>

    <ConfirmDialog
      :open="deleteDialogOpen"
      title="حذف تورنمنت"
      :description="`آیا مطمئن هستید که می‌خواهید تورنمنت «${pendingDeleteTournament?.title ?? ''}» را حذف کنید؟`"
      confirm-label="حذف"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onDeleteConfirm"
      @cancel="onDeleteCancel"
    />
  </div>
</template>

<script setup lang="ts">
import type { TournamentListItemDto, TournamentStatus, TournamentFormat } from '@dragon/types';
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.TOURNAMENT_READ,
});
useHead({ title: 'مدیریت تورنمنت‌ها — Dragon Admin' });

const PAGE_LIMIT = 20;

const { hasPermission } = useAdminPermissions();
const {
  tournaments,
  tournamentsPage,
  tournamentsLoading,
  tournamentsError,
  loadTournaments,
  deleteTournament,
  actionLoading,
} = useAdminTournaments();

const statusFilter = ref('');
const formatFilter = ref('');
const deleteDialogOpen = ref(false);
const pendingDeleteTournament = ref<TournamentListItemDto | null>(null);

function buildParams(page = 1) {
  return {
    page,
    limit: PAGE_LIMIT,
    ...(statusFilter.value ? { status: statusFilter.value as TournamentStatus } : {}),
    ...(formatFilter.value ? { format: formatFilter.value as TournamentFormat } : {}),
  };
}

async function load(page = 1) {
  await loadTournaments(buildParams(page));
}

function onFilterChange() {
  void load(1);
}

function goToPage(page: number) {
  void load(page);
}

function onDeleteRequest(tournament: TournamentListItemDto) {
  pendingDeleteTournament.value = tournament;
  deleteDialogOpen.value = true;
}

async function onDeleteConfirm() {
  if (!pendingDeleteTournament.value) return;
  const ok = await deleteTournament(pendingDeleteTournament.value.id);
  if (ok) {
    deleteDialogOpen.value = false;
    pendingDeleteTournament.value = null;
  }
}

function onDeleteCancel() {
  deleteDialogOpen.value = false;
  pendingDeleteTournament.value = null;
}

onMounted(() => {
  if (hasPermission(Permissions.TOURNAMENT_READ)) {
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
  box-shadow: 0 6px 20px -6px rgba(109, 40, 217, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all var(--motion-fast);
}

.new-btn:hover {
  background: var(--purple-400);
  box-shadow: 0 10px 28px -6px rgba(109, 40, 217, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.filters {
  display: flex;
  gap: 8px;
  margin-block-end: 16px;
  flex-wrap: wrap;
}

.filter-select {
  height: 36px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: var(--input-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color var(--motion-fast);
  appearance: none;
}

.filter-select:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
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
