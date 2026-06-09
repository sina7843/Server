<template>
  <div class="page">
    <TournamentNavBar />

    <UnauthorizedState v-if="!accessToken" />

    <ForbiddenState v-else-if="!hasPermission(Permissions.TOURNAMENT_MATCH_READ)" />

    <template v-else>
      <!-- Action feedback -->
      <div v-if="actionSuccess" class="alert alert--success" role="status">
        {{ actionSuccess }}
      </div>
      <div v-if="actionError" class="alert alert--error" role="alert">
        {{ actionError }}
      </div>

      <!-- Recalculate control -->
      <div v-if="canRecalculate" class="controls">
        <button
          class="ctrl-btn ctrl-btn--recalc"
          type="button"
          :disabled="actionLoading || standingsLoading"
          @click="recalcDialogOpen = true"
        >
          محاسبه مجدد امتیازات
        </button>
      </div>

      <LoadingState v-if="standingsLoading" />
      <ErrorState v-else-if="standingsError" :message="standingsError" @retry="load" />

      <template v-else-if="standings">
        <div class="meta-row">
          <span class="meta-label">فرمت:</span>
          <span class="meta-value">{{ standings.format }}</span>
          <span class="meta-sep">·</span>
          <span class="meta-label">آخرین به‌روزرسانی:</span>
          <span class="meta-value">{{ formatDate(standings.updatedAt) }}</span>
        </div>

        <EmptyState
          v-if="standings.standings.length === 0"
          label="جدول امتیازات هنوز در دسترس نیست."
        />

        <div v-else class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th class="th-rank">رتبه</th>
                <th>شرکت‌کننده</th>
                <th class="th-num">برد</th>
                <th class="th-num">باخت</th>
                <th class="th-num">امتیاز</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in standings.standings" :key="entry.participantId" class="table-row">
                <td class="td-rank">{{ entry.rank }}</td>
                <td class="td-name">{{ entry.displayName }}</td>
                <td class="td-num">{{ entry.wins }}</td>
                <td class="td-num">{{ entry.losses }}</td>
                <td class="td-points">{{ entry.points }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <EmptyState v-else label="جدول امتیازات هنوز در دسترس نیست." />
    </template>

    <!-- Recalculate confirmation -->
    <ConfirmDialog
      :open="recalcDialogOpen"
      title="محاسبه مجدد امتیازات"
      description="آیا مطمئن هستید که می‌خواهید جدول امتیازات این تورنمنت را مجدداً محاسبه کنید؟ این عمل بر اساس نتایج ثبت‌شده انجام می‌شود."
      confirm-label="محاسبه مجدد"
      :destructive="false"
      :loading="actionLoading"
      @confirm="onRecalcConfirm"
      @cancel="recalcDialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.TOURNAMENT_MATCH_READ,
});
useHead({ title: 'جدول امتیازات — Dragon Admin' });

const route = useRoute();
const tournamentId = String(route.params['id']);

const { accessToken } = useAdminAuthState();
const { hasPermission } = useAdminPermissions();
const {
  standings,
  standingsLoading,
  standingsError,
  loadStandings,
  recalculateStandings,
  actionLoading,
  actionError,
  actionSuccess,
  clearActionState,
} = useAdminTournamentStandings();

const canRecalculate = computed(() => hasPermission(Permissions.TOURNAMENT_RESULT_MANAGE));

const recalcDialogOpen = ref(false);

async function load() {
  clearActionState();
  await loadStandings(tournamentId);
}

async function onRecalcConfirm() {
  const result = await recalculateStandings(tournamentId);
  if (result) {
    recalcDialogOpen.value = false;
    await loadStandings(tournamentId);
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => {
  if (hasPermission(Permissions.TOURNAMENT_MATCH_READ)) {
    void load();
  }
});
</script>

<style scoped>
.page {
  max-width: 900px;
}

.alert {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  margin-block-end: 1rem;
  border: 1px solid transparent;
}

.alert--success {
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-400);
  border-color: rgba(16, 185, 129, 0.25);
}

.alert--error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-400);
  border-color: rgba(239, 68, 68, 0.25);
}

.controls {
  margin-block-end: 1.25rem;
}

.ctrl-btn {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--motion-fast);
  font-family: inherit;
}

.ctrl-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ctrl-btn--recalc {
  background: rgba(109, 40, 217, 0.12);
  color: var(--purple-300);
  border-color: rgba(109, 40, 217, 0.3);
}

.ctrl-btn--recalc:not(:disabled):hover {
  background: rgba(109, 40, 217, 0.2);
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  margin-block-end: 1rem;
  flex-wrap: wrap;
}

.meta-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.meta-value {
  color: var(--text-muted);
}

.meta-sep {
  color: var(--border-strong);
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.table th {
  text-align: right;
  padding: 10px 14px;
  background: var(--hover-overlay);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  border-block-end: 1px solid var(--border-default);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.table td {
  padding: 11px 14px;
  border-block-end: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  vertical-align: middle;
}

.table-row {
  transition: background var(--motion-fast);
}

.table-row:hover {
  background: var(--hover-overlay);
}

.th-rank,
.td-rank {
  width: 56px;
  text-align: center;
  font-weight: 700;
  color: var(--text-primary);
}

.th-num,
.td-num {
  width: 64px;
  text-align: center;
}

.td-name {
  font-weight: 500;
  color: var(--text-primary);
}

.td-points {
  text-align: center;
  font-weight: 700;
  color: var(--purple-400);
}
</style>
