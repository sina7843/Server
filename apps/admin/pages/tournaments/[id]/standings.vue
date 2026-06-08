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
  padding: 0.6rem 0.85rem;
  border-radius: 0.4rem;
  font-size: 0.875rem;
  margin-block-end: 1rem;
}

.alert--success {
  background: #dcfce7;
  color: #166534;
}

.alert--error {
  background: #fee2e2;
  color: #dc2626;
}

.controls {
  margin-block-end: 1.25rem;
}

.ctrl-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.ctrl-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ctrl-btn--recalc {
  background: #ede9fe;
  color: #5b21b6;
}

.ctrl-btn--recalc:not(:disabled):hover {
  background: #ddd6fe;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #64748b;
  margin-block-end: 1rem;
  flex-wrap: wrap;
}

.meta-label {
  font-weight: 600;
}

.meta-sep {
  color: #cbd5e1;
}

.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.table th {
  text-align: right;
  padding: 0.55rem 0.75rem;
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e2e8f0;
}

.table td {
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
  vertical-align: middle;
}

.table-row:hover {
  background: #f8fafc;
}

.th-rank,
.td-rank {
  width: 56px;
  text-align: center;
  font-weight: 700;
  color: #1e293b;
}

.th-num,
.td-num {
  width: 64px;
  text-align: center;
}

.td-name {
  font-weight: 500;
  color: #1e293b;
}

.td-points {
  text-align: center;
  font-weight: 700;
  color: #6366f1;
}
</style>
