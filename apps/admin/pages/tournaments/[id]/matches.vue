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
  display: flex;
  gap: 0.75rem;
  margin-block-end: 1.25rem;
  flex-wrap: wrap;
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

.ctrl-btn--generate {
  background: #ede9fe;
  color: #5b21b6;
}

.ctrl-btn--generate:not(:disabled):hover {
  background: #ddd6fe;
}

.ctrl-btn--create {
  background: #dcfce7;
  color: #166534;
}

.ctrl-btn--create:not(:disabled):hover {
  background: #bbf7d0;
}

.round-group {
  margin-block-end: 1.5rem;
}

.round-title {
  margin: 0 0 0.6rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.4rem 0.75rem;
  background: #f8fafc;
  border-inline-start: 3px solid #6366f1;
  border-radius: 0 0.25rem 0.25rem 0;
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

.td-date {
  white-space: nowrap;
  font-size: 0.8rem;
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

.action-btn--edit {
  background: #eff6ff;
  color: #1d4ed8;
}

.action-btn--edit:not(:disabled):hover {
  background: #dbeafe;
}

.action-btn--cancel {
  background: #fee2e2;
  color: #991b1b;
}

.action-btn--cancel:not(:disabled):hover {
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

.field-hint {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
}

.field-hint--error {
  color: #dc2626;
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
