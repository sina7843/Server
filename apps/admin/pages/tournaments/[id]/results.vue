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

.td-round {
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  width: 48px;
}

.td-num {
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  width: 48px;
}

.td-id {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
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
  height: 28px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--motion-fast);
  margin-inline-end: 4px;
  font-family: inherit;
}

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.action-btn--record {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-400);
  border-color: rgba(16, 185, 129, 0.25);
}

.action-btn--record:not(:disabled):hover {
  background: rgba(16, 185, 129, 0.18);
}

.action-btn--update {
  background: rgba(109, 40, 217, 0.1);
  color: var(--purple-300);
  border-color: rgba(109, 40, 217, 0.25);
}

.action-btn--update:not(:disabled):hover {
  background: rgba(109, 40, 217, 0.18);
}

.action-btn--void {
  background: rgba(239, 68, 68, 0.08);
  color: var(--danger-400);
  border-color: rgba(239, 68, 68, 0.25);
}

.action-btn--void:not(:disabled):hover {
  background: rgba(239, 68, 68, 0.15);
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  backdrop-filter: blur(4px);
}

.dialog {
  background: var(--surface-elevated);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  max-width: 460px;
  width: calc(100% - 2rem);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(20px);
}

.dialog-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.dialog-desc {
  margin: 0 0 16px;
  font-size: 13.5px;
  color: var(--text-muted);
}

.field {
  margin-block-end: 12px;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-block-end: 6px;
}

.field-input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13.5px;
  box-sizing: border-box;
  outline: none;
  transition: border-color var(--motion-fast);
  appearance: none;
  cursor: pointer;
}

.field-input:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-block-start: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--motion-fast);
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--hover-overlay);
  color: var(--text-secondary);
  border-color: var(--border-default);
}

.btn-cancel:not(:disabled):hover {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
}

.btn-confirm {
  background: var(--purple-500);
  color: #fff;
  box-shadow: 0 4px 16px -4px rgba(109, 40, 217, 0.5);
}

.btn-confirm:not(:disabled):hover {
  background: var(--purple-400);
}

.btn-confirm:disabled {
  opacity: 0.5;
}

.btn-spinner {
  width: 14px;
  height: 14px;
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
