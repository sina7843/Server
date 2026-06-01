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
import type { AdminTournamentDto, TournamentStatus, TournamentFormat } from '@dragon/types';
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
const pendingDeleteTournament = ref<AdminTournamentDto | null>(null);

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

function onDeleteRequest(tournament: AdminTournamentDto) {
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
  display: flex;
  gap: 0.75rem;
  margin-block-end: 1.25rem;
  flex-wrap: wrap;
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
