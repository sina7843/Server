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

      <!-- Top controls -->
      <div class="controls">
        <button
          v-if="canManage"
          class="ctrl-btn ctrl-btn--generate"
          type="button"
          :disabled="actionLoading"
          @click="generateDialogOpen = true"
        >
          تولید خودکار مسابقات
        </button>
        <button
          v-if="canManage"
          class="ctrl-btn ctrl-btn--create"
          type="button"
          :disabled="actionLoading"
          @click="onCreateRequest"
        >
          + مسابقه دستی
        </button>
      </div>

      <LoadingState v-if="matchesLoading" />
      <ErrorState v-else-if="matchesError" :message="matchesError" @retry="load" />
      <EmptyState v-else-if="matches.length === 0" label="هیچ مسابقه‌ای یافت نشد." />

      <template v-else>
        <!-- Grouped by round -->
        <div v-for="round in rounds" :key="round" class="round-group">
          <h2 class="round-title">دور {{ round }}</h2>
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>شماره</th>
                  <th>شرکت‌کننده ۱</th>
                  <th>شرکت‌کننده ۲</th>
                  <th>برنده</th>
                  <th>وضعیت</th>
                  <th>زمان</th>
                  <th v-if="canManage">عملیات</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="match in matchesByRound(round)" :key="match.id" class="table-row">
                  <td class="td-num">{{ match.matchNumber }}</td>
                  <td>{{ resolveParticipantName(match.participant1Id) }}</td>
                  <td>{{ resolveParticipantName(match.participant2Id) }}</td>
                  <td>{{ resolveParticipantName(match.winnerId) }}</td>
                  <td><MatchStatusBadge :status="match.status" /></td>
                  <td class="td-date">
                    {{ match.scheduledAt ? formatDate(match.scheduledAt) : '—' }}
                  </td>
                  <td v-if="canManage" class="td-actions">
                    <button
                      v-if="match.status !== 'cancelled' && match.status !== 'completed'"
                      class="action-btn action-btn--edit"
                      type="button"
                      :disabled="actionLoading"
                      @click="onEditRequest(match)"
                    >
                      ویرایش
                    </button>
                    <button
                      v-if="match.status === 'scheduled' || match.status === 'in_progress'"
                      class="action-btn action-btn--cancel"
                      type="button"
                      :disabled="actionLoading"
                      @click="onCancelRequest(match)"
                    >
                      لغو
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>

    <!-- Generate matches confirmation -->
    <ConfirmDialog
      :open="generateDialogOpen"
      title="تولید خودکار مسابقات"
      description="آیا مطمئن هستید که می‌خواهید مسابقات این تورنمنت را به صورت خودکار تولید کنید؟ مسابقات موجود ممکن است تحت تأثیر قرار گیرند."
      confirm-label="تولید مسابقات"
      :destructive="false"
      :loading="actionLoading"
      @confirm="onGenerateConfirm"
      @cancel="generateDialogOpen = false"
    />

    <!-- Cancel match confirmation -->
    <ConfirmDialog
      :open="cancelDialogOpen"
      title="لغو مسابقه"
      :description="`آیا مطمئن هستید که می‌خواهید مسابقه شماره ${pendingMatch?.matchNumber ?? ''} (دور ${pendingMatch?.round ?? ''}) را لغو کنید؟`"
      confirm-label="لغو مسابقه"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onCancelConfirm"
      @cancel="cancelDialogOpen = false"
    />

    <!-- Create match dialog -->
    <Teleport to="body">
      <div v-if="createDialogOpen" class="overlay" role="dialog" aria-modal="true">
        <div class="dialog">
          <h2 class="dialog-title">ایجاد مسابقه دستی</h2>
          <div class="field">
            <label class="field-label" for="create-round">دور *</label>
            <input
              id="create-round"
              v-model.number="createForm.round"
              class="field-input"
              type="number"
              min="1"
              placeholder="شماره دور"
            />
          </div>
          <div class="field">
            <label class="field-label" for="create-match-num">شماره مسابقه *</label>
            <input
              id="create-match-num"
              v-model.number="createForm.matchNumber"
              class="field-input"
              type="number"
              min="1"
              placeholder="شماره مسابقه"
            />
          </div>
          <div class="field">
            <label class="field-label" for="create-p1">شرکت‌کننده ۱</label>
            <select
              id="create-p1"
              v-model="createForm.participant1Id"
              class="field-input"
              :disabled="participantsLoading || !!participantsError"
            >
              <option value="">— بدون شرکت‌کننده —</option>
              <option v-for="p in participants" :key="p.id" :value="p.id">
                {{ p.displayName }}{{ p.seed != null ? ` (#${p.seed})` : '' }}
              </option>
            </select>
            <p v-if="participantsError" class="field-hint field-hint--error">
              {{ participantsError }}
            </p>
          </div>
          <div class="field">
            <label class="field-label" for="create-p2">شرکت‌کننده ۲</label>
            <select
              id="create-p2"
              v-model="createForm.participant2Id"
              class="field-input"
              :disabled="participantsLoading || !!participantsError"
            >
              <option value="">— بدون شرکت‌کننده —</option>
              <option v-for="p in participants" :key="p.id" :value="p.id">
                {{ p.displayName }}{{ p.seed != null ? ` (#${p.seed})` : '' }}
              </option>
            </select>
            <p v-if="participantsError" class="field-hint field-hint--error">
              {{ participantsError }}
            </p>
          </div>
          <div class="field">
            <label class="field-label" for="create-scheduled">زمان برگزاری</label>
            <input
              id="create-scheduled"
              v-model="createForm.scheduledAt"
              class="field-input"
              type="datetime-local"
            />
          </div>
          <div v-if="createError" class="alert alert--error">{{ createError }}</div>
          <div class="dialog-actions">
            <button
              class="btn btn-cancel"
              type="button"
              :disabled="actionLoading"
              @click="createDialogOpen = false"
            >
              انصراف
            </button>
            <button
              class="btn btn-confirm"
              type="button"
              :disabled="actionLoading || !isCreateValid"
              @click="onCreateConfirm"
            >
              <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
              ایجاد
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit match dialog -->
    <Teleport to="body">
      <div v-if="editDialogOpen" class="overlay" role="dialog" aria-modal="true">
        <div class="dialog">
          <h2 class="dialog-title">ویرایش مسابقه</h2>
          <p class="dialog-desc">
            دور {{ pendingMatch?.round }} — شماره {{ pendingMatch?.matchNumber }}
          </p>
          <div class="field">
            <label class="field-label" for="edit-p1">شرکت‌کننده ۱</label>
            <select
              id="edit-p1"
              v-model="editForm.participant1Id"
              class="field-input"
              :disabled="participantsLoading || !!participantsError"
            >
              <option value="">— بدون شرکت‌کننده —</option>
              <option v-for="p in participants" :key="p.id" :value="p.id">
                {{ p.displayName }}{{ p.seed != null ? ` (#${p.seed})` : '' }}
              </option>
            </select>
            <p v-if="participantsError" class="field-hint field-hint--error">
              {{ participantsError }}
            </p>
          </div>
          <div class="field">
            <label class="field-label" for="edit-p2">شرکت‌کننده ۲</label>
            <select
              id="edit-p2"
              v-model="editForm.participant2Id"
              class="field-input"
              :disabled="participantsLoading || !!participantsError"
            >
              <option value="">— بدون شرکت‌کننده —</option>
              <option v-for="p in participants" :key="p.id" :value="p.id">
                {{ p.displayName }}{{ p.seed != null ? ` (#${p.seed})` : '' }}
              </option>
            </select>
            <p v-if="participantsError" class="field-hint field-hint--error">
              {{ participantsError }}
            </p>
          </div>
          <div class="field">
            <label class="field-label" for="edit-scheduled">زمان برگزاری</label>
            <input
              id="edit-scheduled"
              v-model="editForm.scheduledAt"
              class="field-input"
              type="datetime-local"
            />
          </div>
          <div class="field">
            <label class="field-label" for="edit-notes">یادداشت</label>
            <input
              id="edit-notes"
              v-model="editForm.notes"
              class="field-input"
              type="text"
              placeholder="یادداشت (اختیاری)"
            />
          </div>
          <div v-if="editError" class="alert alert--error">{{ editError }}</div>
          <div class="dialog-actions">
            <button
              class="btn btn-cancel"
              type="button"
              :disabled="actionLoading"
              @click="editDialogOpen = false"
            >
              انصراف
            </button>
            <button
              class="btn btn-confirm"
              type="button"
              :disabled="actionLoading"
              @click="onEditConfirm"
            >
              <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
              ذخیره
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { AdminTournamentMatchDto, TournamentMatchStatus } from '@dragon/types';
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.TOURNAMENT_MATCH_READ,
});
useHead({ title: 'مدیریت مسابقات — Dragon Admin' });

const route = useRoute();
const tournamentId = String(route.params['id']);

const { accessToken } = useAdminAuthState();
const { hasPermission } = useAdminPermissions();
const {
  matches,
  matchesLoading,
  matchesError,
  loadMatches,
  generateMatches,
  createMatch,
  updateMatch,
  cancelMatch,
  actionLoading,
  actionError,
  actionSuccess,
  clearActionState,
} = useAdminTournamentMatches();

const { participants, participantsLoading, participantsError, loadParticipants } =
  useAdminTournamentParticipants();

const canManage = computed(() => hasPermission(Permissions.TOURNAMENT_MATCH_MANAGE));

const generateDialogOpen = ref(false);
const cancelDialogOpen = ref(false);
const createDialogOpen = ref(false);
const editDialogOpen = ref(false);
const pendingMatch = ref<AdminTournamentMatchDto | null>(null);
const createError = ref<string | null>(null);
const editError = ref<string | null>(null);

const createForm = reactive<{
  round: number | null;
  matchNumber: number | null;
  participant1Id: string;
  participant2Id: string;
  scheduledAt: string;
}>({
  round: null,
  matchNumber: null,
  participant1Id: '',
  participant2Id: '',
  scheduledAt: '',
});

const editForm = reactive<{
  participant1Id: string;
  participant2Id: string;
  scheduledAt: string;
  notes: string;
}>({
  participant1Id: '',
  participant2Id: '',
  scheduledAt: '',
  notes: '',
});

const isCreateValid = computed(
  () =>
    createForm.round !== null &&
    createForm.round > 0 &&
    createForm.matchNumber !== null &&
    createForm.matchNumber > 0,
);

const rounds = computed(() => {
  const set = new Set(matches.value.map((m) => m.round));
  return [...set].sort((a, b) => a - b);
});

const participantMap = computed(() => {
  const map = new Map<string, string>();
  for (const p of participants.value) map.set(p.id, p.displayName);
  return map;
});

function resolveParticipantName(id?: string | null): string {
  if (!id) return '—';
  return participantMap.value.get(id) ?? id;
}

function matchesByRound(round: number): readonly AdminTournamentMatchDto[] {
  return matches.value
    .filter((m) => m.round === round)
    .slice()
    .sort((a, b) => a.matchNumber - b.matchNumber);
}

async function load() {
  clearActionState();
  await Promise.all([
    loadMatches(tournamentId, { limit: 100 }),
    loadParticipants(tournamentId, { limit: 200 }),
  ]);
}

async function onGenerateConfirm() {
  const ok = await generateMatches(tournamentId);
  if (ok) generateDialogOpen.value = false;
}

function onCreateRequest() {
  createForm.round = null;
  createForm.matchNumber = null;
  createForm.participant1Id = '';
  createForm.participant2Id = '';
  createForm.scheduledAt = '';
  createError.value = null;
  createDialogOpen.value = true;
}

async function onCreateConfirm() {
  if (!isCreateValid.value) return;
  createError.value = null;

  const input: {
    round: number;
    matchNumber: number;
    participant1Id?: string;
    participant2Id?: string;
    scheduledAt?: string;
  } = {
    round: createForm.round as number,
    matchNumber: createForm.matchNumber as number,
  };
  if (createForm.participant1Id.trim()) input.participant1Id = createForm.participant1Id.trim();
  if (createForm.participant2Id.trim()) input.participant2Id = createForm.participant2Id.trim();
  if (createForm.scheduledAt) input.scheduledAt = new Date(createForm.scheduledAt).toISOString();

  const ok = await createMatch(tournamentId, input);
  if (ok) {
    createDialogOpen.value = false;
  } else {
    createError.value = actionError.value ?? 'خطا در ایجاد مسابقه.';
  }
}

function onEditRequest(match: AdminTournamentMatchDto) {
  pendingMatch.value = match;
  editForm.participant1Id = match.participant1Id ?? '';
  editForm.participant2Id = match.participant2Id ?? '';
  editForm.scheduledAt = match.scheduledAt
    ? new Date(match.scheduledAt).toISOString().slice(0, 16)
    : '';
  editForm.notes = match.notes ?? '';
  editError.value = null;
  editDialogOpen.value = true;
}

async function onEditConfirm() {
  if (!pendingMatch.value) return;
  editError.value = null;

  const input: {
    participant1Id?: string;
    participant2Id?: string;
    scheduledAt?: string;
    notes?: string;
  } = {};
  if (editForm.participant1Id.trim()) input.participant1Id = editForm.participant1Id.trim();
  if (editForm.participant2Id.trim()) input.participant2Id = editForm.participant2Id.trim();
  if (editForm.scheduledAt) input.scheduledAt = new Date(editForm.scheduledAt).toISOString();
  if (editForm.notes.trim()) input.notes = editForm.notes.trim();

  const ok = await updateMatch(tournamentId, pendingMatch.value.id, input);
  if (ok) {
    editDialogOpen.value = false;
    pendingMatch.value = null;
  } else {
    editError.value = actionError.value ?? 'خطا در ویرایش مسابقه.';
  }
}

function onCancelRequest(match: AdminTournamentMatchDto) {
  pendingMatch.value = match;
  cancelDialogOpen.value = true;
}

async function onCancelConfirm() {
  if (!pendingMatch.value) return;
  const ok = await cancelMatch(tournamentId, pendingMatch.value.id);
  if (ok) {
    cancelDialogOpen.value = false;
    pendingMatch.value = null;
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

.controls {
  display: flex;
  gap: 8px;
  margin-block-end: 1.25rem;
  flex-wrap: wrap;
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

.ctrl-btn--generate {
  background: rgba(109, 40, 217, 0.12);
  color: var(--purple-300);
  border-color: rgba(109, 40, 217, 0.3);
}

.ctrl-btn--generate:not(:disabled):hover {
  background: rgba(109, 40, 217, 0.2);
}

.ctrl-btn--create {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-400);
  border-color: rgba(16, 185, 129, 0.25);
}

.ctrl-btn--create:not(:disabled):hover {
  background: rgba(16, 185, 129, 0.18);
}

.round-group {
  margin-block-end: 1.5rem;
}

.round-title {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--purple-300);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-sans-en);
  padding: 6px 12px;
  background: rgba(109, 40, 217, 0.08);
  border-inline-start: 2px solid var(--purple-400);
  border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  margin-block-end: 8px;
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

.td-date {
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
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

.action-btn--edit {
  background: rgba(109, 40, 217, 0.1);
  color: var(--purple-300);
  border-color: rgba(109, 40, 217, 0.25);
}

.action-btn--edit:not(:disabled):hover {
  background: rgba(109, 40, 217, 0.18);
}

.action-btn--cancel {
  background: rgba(239, 68, 68, 0.08);
  color: var(--danger-400);
  border-color: rgba(239, 68, 68, 0.25);
}

.action-btn--cancel:not(:disabled):hover {
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
  max-height: 90vh;
  overflow-y: auto;
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

.field-hint {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--text-muted);
}

.field-hint--error {
  color: var(--danger-400);
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
