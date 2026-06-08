<template>
  <div class="page">
    <TournamentNavBar />

    <UnauthorizedState v-if="!accessToken" />

    <ForbiddenState v-else-if="!hasPermission(Permissions.TOURNAMENT_MATCH_READ)" />

    <template v-else>
      <!-- Action feedback -->
      <div v-if="resultActionSuccess" class="alert alert--success" role="status">
        {{ resultActionSuccess }}
      </div>
      <div v-if="resultActionError" class="alert alert--error" role="alert">
        {{ resultActionError }}
      </div>

      <LoadingState v-if="matchesLoading" />
      <ErrorState v-else-if="matchesError" :message="matchesError" @retry="load" />
      <EmptyState v-else-if="matches.length === 0" label="هیچ مسابقه‌ای یافت نشد." />

      <template v-else>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>دور</th>
                <th>شماره</th>
                <th>شرکت‌کننده ۱</th>
                <th>شرکت‌کننده ۲</th>
                <th>برنده</th>
                <th>وضعیت</th>
                <th v-if="canManageResults">عملیات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="match in sortedMatches" :key="match.id" class="table-row">
                <td class="td-round">{{ match.round }}</td>
                <td class="td-num">{{ match.matchNumber }}</td>
                <td>{{ resolveParticipantName(match.participant1Id) }}</td>
                <td>{{ resolveParticipantName(match.participant2Id) }}</td>
                <td>{{ resolveParticipantName(match.winnerId) }}</td>
                <td><MatchStatusBadge :status="match.status" /></td>
                <td v-if="canManageResults" class="td-actions">
                  <button
                    v-if="canRecord(match)"
                    class="action-btn action-btn--record"
                    type="button"
                    :disabled="resultActionLoading"
                    @click="onRecordRequest(match)"
                  >
                    ثبت نتیجه
                  </button>
                  <button
                    v-if="canUpdate(match)"
                    class="action-btn action-btn--update"
                    type="button"
                    :disabled="resultActionLoading"
                    @click="onUpdateRequest(match)"
                  >
                    ویرایش نتیجه
                  </button>
                  <button
                    v-if="canVoid(match)"
                    class="action-btn action-btn--void"
                    type="button"
                    :disabled="resultActionLoading"
                    @click="onVoidRequest(match)"
                  >
                    باطل کردن
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <!-- Void result confirmation -->
    <ConfirmDialog
      :open="voidDialogOpen"
      title="باطل کردن نتیجه"
      :description="`آیا مطمئن هستید که می‌خواهید نتیجه مسابقه شماره ${pendingMatch?.matchNumber ?? ''} (دور ${pendingMatch?.round ?? ''}) را باطل کنید؟`"
      confirm-label="باطل کردن"
      :destructive="true"
      :loading="resultActionLoading"
      @confirm="onVoidConfirm"
      @cancel="voidDialogOpen = false"
    />

    <!-- Record result dialog -->
    <Teleport to="body">
      <div v-if="recordDialogOpen" class="overlay" role="dialog" aria-modal="true">
        <div class="dialog">
          <h2 class="dialog-title">ثبت نتیجه</h2>
          <p class="dialog-desc">
            دور {{ pendingMatch?.round }} — شماره {{ pendingMatch?.matchNumber }}
          </p>
          <div class="field">
            <label class="field-label" for="record-winner">برنده *</label>
            <select id="record-winner" v-model="resultForm.winnerId" class="field-input">
              <option value="">انتخاب کنید...</option>
              <option v-if="pendingMatch?.participant1Id" :value="pendingMatch.participant1Id">
                {{ resolveParticipantName(pendingMatch.participant1Id) }}
              </option>
              <option v-if="pendingMatch?.participant2Id" :value="pendingMatch.participant2Id">
                {{ resolveParticipantName(pendingMatch.participant2Id) }}
              </option>
            </select>
          </div>
          <div class="field">
            <label class="field-label" for="record-score1">امتیاز شرکت‌کننده ۱</label>
            <input
              id="record-score1"
              v-model.number="resultForm.participant1Score"
              class="field-input"
              type="number"
              min="0"
              placeholder="امتیاز (اختیاری)"
            />
          </div>
          <div class="field">
            <label class="field-label" for="record-score2">امتیاز شرکت‌کننده ۲</label>
            <input
              id="record-score2"
              v-model.number="resultForm.participant2Score"
              class="field-input"
              type="number"
              min="0"
              placeholder="امتیاز (اختیاری)"
            />
          </div>
          <div class="field">
            <label class="field-label" for="record-notes">یادداشت</label>
            <input
              id="record-notes"
              v-model="resultForm.notes"
              class="field-input"
              type="text"
              placeholder="یادداشت (اختیاری)"
            />
          </div>
          <div v-if="dialogError" class="alert alert--error">{{ dialogError }}</div>
          <div class="dialog-actions">
            <button
              class="btn btn-cancel"
              type="button"
              :disabled="resultActionLoading"
              @click="recordDialogOpen = false"
            >
              انصراف
            </button>
            <button
              class="btn btn-confirm"
              type="button"
              :disabled="resultActionLoading || !resultForm.winnerId"
              @click="onRecordConfirm"
            >
              <span v-if="resultActionLoading" class="btn-spinner" aria-hidden="true" />
              ثبت
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Update result dialog -->
    <Teleport to="body">
      <div v-if="updateDialogOpen" class="overlay" role="dialog" aria-modal="true">
        <div class="dialog">
          <h2 class="dialog-title">ویرایش نتیجه</h2>
          <p class="dialog-desc">
            دور {{ pendingMatch?.round }} — شماره {{ pendingMatch?.matchNumber }}
          </p>
          <div class="field">
            <label class="field-label" for="update-winner">برنده *</label>
            <select id="update-winner" v-model="resultForm.winnerId" class="field-input">
              <option value="">انتخاب کنید...</option>
              <option v-if="pendingMatch?.participant1Id" :value="pendingMatch.participant1Id">
                {{ resolveParticipantName(pendingMatch.participant1Id) }}
              </option>
              <option v-if="pendingMatch?.participant2Id" :value="pendingMatch.participant2Id">
                {{ resolveParticipantName(pendingMatch.participant2Id) }}
              </option>
            </select>
          </div>
          <div class="field">
            <label class="field-label" for="update-score1">امتیاز شرکت‌کننده ۱</label>
            <input
              id="update-score1"
              v-model.number="resultForm.participant1Score"
              class="field-input"
              type="number"
              min="0"
              placeholder="امتیاز (اختیاری)"
            />
          </div>
          <div class="field">
            <label class="field-label" for="update-score2">امتیاز شرکت‌کننده ۲</label>
            <input
              id="update-score2"
              v-model.number="resultForm.participant2Score"
              class="field-input"
              type="number"
              min="0"
              placeholder="امتیاز (اختیاری)"
            />
          </div>
          <div class="field">
            <label class="field-label" for="update-notes">یادداشت</label>
            <input
              id="update-notes"
              v-model="resultForm.notes"
              class="field-input"
              type="text"
              placeholder="یادداشت (اختیاری)"
            />
          </div>
          <div v-if="dialogError" class="alert alert--error">{{ dialogError }}</div>
          <div class="dialog-actions">
            <button
              class="btn btn-cancel"
              type="button"
              :disabled="resultActionLoading"
              @click="updateDialogOpen = false"
            >
              انصراف
            </button>
            <button
              class="btn btn-confirm"
              type="button"
              :disabled="resultActionLoading || !resultForm.winnerId"
              @click="onUpdateConfirm"
            >
              <span v-if="resultActionLoading" class="btn-spinner" aria-hidden="true" />
              ذخیره
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { AdminTournamentMatchDto } from '@dragon/types';
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.TOURNAMENT_MATCH_READ,
});
useHead({ title: 'مدیریت نتایج — Dragon Admin' });

const route = useRoute();
const tournamentId = String(route.params['id']);

const { accessToken } = useAdminAuthState();
const { hasPermission } = useAdminPermissions();
const {
  matches,
  matchesLoading,
  matchesError,
  loadMatches,
  clearActionState: clearMatchActionState,
} = useAdminTournamentMatches();

const {
  recordResult,
  updateResult,
  voidResult,
  actionLoading: resultActionLoading,
  actionError: resultActionError,
  actionSuccess: resultActionSuccess,
  clearActionState: clearResultActionState,
} = useAdminTournamentResults();

const { participants, loadParticipants } = useAdminTournamentParticipants();

const participantMap = computed(() => {
  const map = new Map<string, string>();
  for (const p of participants.value) map.set(p.id, p.displayName);
  return map;
});

function resolveParticipantName(id?: string | null): string {
  if (!id) return '—';
  return participantMap.value.get(id) ?? id;
}

const canManageResults = computed(() => hasPermission(Permissions.TOURNAMENT_RESULT_MANAGE));

const voidDialogOpen = ref(false);
const recordDialogOpen = ref(false);
const updateDialogOpen = ref(false);
const pendingMatch = ref<AdminTournamentMatchDto | null>(null);
const dialogError = ref<string | null>(null);

const resultForm = reactive<{
  winnerId: string;
  participant1Score: number | null;
  participant2Score: number | null;
  notes: string;
}>({
  winnerId: '',
  participant1Score: null,
  participant2Score: null,
  notes: '',
});

const sortedMatches = computed(() =>
  [...matches.value].sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber),
);

function canRecord(match: AdminTournamentMatchDto): boolean {
  return (
    match.status !== 'cancelled' &&
    !match.winnerId &&
    !!match.participant1Id &&
    !!match.participant2Id
  );
}

function canUpdate(match: AdminTournamentMatchDto): boolean {
  return match.status === 'completed' && !!match.winnerId;
}

function canVoid(match: AdminTournamentMatchDto): boolean {
  return match.status === 'completed' && !!match.winnerId;
}

async function load() {
  clearMatchActionState();
  clearResultActionState();
  await Promise.all([
    loadMatches(tournamentId, { limit: 100 }),
    loadParticipants(tournamentId, { limit: 200 }),
  ]);
}

function resetForm(match: AdminTournamentMatchDto) {
  resultForm.winnerId = match.winnerId ?? '';
  resultForm.participant1Score = null;
  resultForm.participant2Score = null;
  resultForm.notes = '';
  dialogError.value = null;
}

function onRecordRequest(match: AdminTournamentMatchDto) {
  pendingMatch.value = match;
  resetForm(match);
  resultForm.winnerId = '';
  recordDialogOpen.value = true;
}

async function onRecordConfirm() {
  if (!pendingMatch.value || !resultForm.winnerId) return;
  dialogError.value = null;

  const input: {
    winnerId: string;
    participant1Score?: number;
    participant2Score?: number;
    notes?: string;
  } = {
    winnerId: resultForm.winnerId,
  };
  if (resultForm.participant1Score !== null) input.participant1Score = resultForm.participant1Score;
  if (resultForm.participant2Score !== null) input.participant2Score = resultForm.participant2Score;
  if (resultForm.notes.trim()) input.notes = resultForm.notes.trim();

  const result = await recordResult(tournamentId, pendingMatch.value.id, input);
  if (result) {
    recordDialogOpen.value = false;
    pendingMatch.value = null;
    await loadMatches(tournamentId, { limit: 100 });
  } else {
    dialogError.value = resultActionError.value ?? 'خطا در ثبت نتیجه.';
  }
}

function onUpdateRequest(match: AdminTournamentMatchDto) {
  pendingMatch.value = match;
  resetForm(match);
  updateDialogOpen.value = true;
}

async function onUpdateConfirm() {
  if (!pendingMatch.value || !resultForm.winnerId) return;
  dialogError.value = null;

  const input: {
    winnerId: string;
    participant1Score?: number;
    participant2Score?: number;
    notes?: string;
  } = {
    winnerId: resultForm.winnerId,
  };
  if (resultForm.participant1Score !== null) input.participant1Score = resultForm.participant1Score;
  if (resultForm.participant2Score !== null) input.participant2Score = resultForm.participant2Score;
  if (resultForm.notes.trim()) input.notes = resultForm.notes.trim();

  const result = await updateResult(tournamentId, pendingMatch.value.id, input);
  if (result) {
    updateDialogOpen.value = false;
    pendingMatch.value = null;
    await loadMatches(tournamentId, { limit: 100 });
  } else {
    dialogError.value = resultActionError.value ?? 'خطا در ویرایش نتیجه.';
  }
}

function onVoidRequest(match: AdminTournamentMatchDto) {
  pendingMatch.value = match;
  voidDialogOpen.value = true;
}

async function onVoidConfirm() {
  if (!pendingMatch.value) return;
  const ok = await voidResult(tournamentId, pendingMatch.value.id);
  if (ok) {
    voidDialogOpen.value = false;
    pendingMatch.value = null;
    await loadMatches(tournamentId, { limit: 100 });
  }
}

onMounted(() => {
  if (hasPermission(Permissions.TOURNAMENT_MATCH_READ)) {
    void load();
  }
});
</script>

<style scoped>
.page {
  max-width: 1100px;
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

.td-round {
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  width: 48px;
}

.td-num {
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  width: 48px;
}

.td-id {
  font-family: monospace;
  font-size: 0.75rem;
  color: #64748b;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-actions {
  white-space: nowrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-inline-end: 0.25rem;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn--record {
  background: #dcfce7;
  color: #166534;
}

.action-btn--record:not(:disabled):hover {
  background: #bbf7d0;
}

.action-btn--update {
  background: #eff6ff;
  color: #1d4ed8;
}

.action-btn--update:not(:disabled):hover {
  background: #dbeafe;
}

.action-btn--void {
  background: #fee2e2;
  color: #991b1b;
}

.action-btn--void:not(:disabled):hover {
  background: #fecaca;
}

/* Dialog */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-width: 460px;
  width: calc(100% - 2rem);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.dialog-title {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.dialog-desc {
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  color: #64748b;
}

.field {
  margin-block-end: 0.85rem;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-block-end: 0.3rem;
}

.field-input {
  width: 100%;
  padding: 0.42rem 0.7rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #374151;
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-block-start: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
}

.btn-cancel:not(:disabled):hover {
  background: #e2e8f0;
}

.btn-confirm {
  background: #3b82f6;
  color: #fff;
}

.btn-confirm:not(:disabled):hover {
  background: #2563eb;
}

.btn-spinner {
  width: 0.85rem;
  height: 0.85rem;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
