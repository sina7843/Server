<template>
  <div class="page">
    <TournamentNavBar />

    <UnauthorizedState v-if="!accessToken" />

    <ForbiddenState v-else-if="!hasPermission(Permissions.TOURNAMENT_PARTICIPANT_READ)" />

    <template v-else>
      <!-- Filters -->
      <div class="filters">
        <select v-model="statusFilter" class="filter-select" @change="onFilterChange">
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="withdrawn">انصراف داده</option>
          <option value="disqualified">محروم شده</option>
          <option value="removed">حذف شده</option>
        </select>
      </div>

      <!-- Action feedback -->
      <div v-if="actionSuccess" class="alert alert--success" role="status">
        {{ actionSuccess }}
      </div>
      <div v-if="actionError" class="alert alert--error" role="alert">
        {{ actionError }}
      </div>

      <LoadingState v-if="participantsLoading" />
      <ErrorState v-else-if="participantsError" :message="participantsError" @retry="load" />
      <EmptyState v-else-if="participants.length === 0" label="هیچ شرکت‌کننده‌ای یافت نشد." />

      <template v-else>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>نام نمایشی</th>
                <th>کاربر</th>
                <th>نوع</th>
                <th>رتبه</th>
                <th>وضعیت</th>
                <th v-if="canManage">عملیات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in participants" :key="p.id" class="table-row">
                <td class="td-name">{{ p.displayName }}</td>
                <td class="td-mono">{{ p.userId }}</td>
                <td>
                  <span v-if="p.teamName" class="type-badge type-badge--team">تیمی</span>
                  <span v-else class="type-badge type-badge--individual">فردی</span>
                </td>
                <td class="td-seed">{{ p.seed ?? '—' }}</td>
                <td>
                  <ParticipantStatusBadge :status="p.status" />
                </td>
                <td v-if="canManage" class="td-actions">
                  <button
                    class="action-btn action-btn--edit"
                    type="button"
                    :disabled="actionLoading"
                    @click="onEditRequest(p)"
                  >
                    ویرایش
                  </button>
                  <button
                    v-if="p.status === 'active'"
                    class="action-btn action-btn--disqualify"
                    type="button"
                    :disabled="actionLoading"
                    @click="onDisqualifyRequest(p)"
                  >
                    محرومیت
                  </button>
                  <button
                    class="action-btn action-btn--remove"
                    type="button"
                    :disabled="actionLoading"
                    @click="onRemoveRequest(p)"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button
            class="page-btn"
            type="button"
            :disabled="participantsPage <= 1"
            @click="goToPage(participantsPage - 1)"
          >
            قبلی
          </button>
          <span class="page-info">صفحه {{ participantsPage }}</span>
          <button
            class="page-btn"
            type="button"
            :disabled="participants.length < PAGE_LIMIT"
            @click="goToPage(participantsPage + 1)"
          >
            بعدی
          </button>
        </div>
      </template>
    </template>

    <!-- Edit dialog -->
    <Teleport to="body">
      <div v-if="editDialogOpen" class="overlay" role="dialog" aria-modal="true">
        <div class="dialog">
          <h2 class="dialog-title">ویرایش شرکت‌کننده</h2>
          <p class="dialog-desc">{{ pendingParticipant?.displayName }}</p>
          <div class="field">
            <label class="field-label" for="edit-display-name">نام نمایشی</label>
            <input
              id="edit-display-name"
              v-model="editDisplayName"
              class="field-input"
              type="text"
              placeholder="نام نمایشی را وارد کنید"
            />
          </div>
          <div class="field">
            <label class="field-label" for="edit-seed">رتبه‌بندی اولیه</label>
            <input
              id="edit-seed"
              v-model.number="editSeed"
              class="field-input"
              type="number"
              min="1"
              placeholder="رتبه را وارد کنید (اختیاری)"
            />
          </div>
          <div v-if="editError" class="alert alert--error" role="alert">{{ editError }}</div>
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
              :disabled="actionLoading || !isEditValid"
              @click="onEditConfirm"
            >
              <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
              ذخیره
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Disqualify dialog -->
    <ConfirmDialog
      :open="disqualifyDialogOpen"
      title="محرومیت شرکت‌کننده"
      :description="`آیا مطمئن هستید که می‌خواهید «${pendingParticipant?.displayName ?? ''}» را محروم کنید؟`"
      confirm-label="محروم کردن"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onDisqualifyConfirm"
      @cancel="disqualifyDialogOpen = false"
    />

    <!-- Remove dialog -->
    <ConfirmDialog
      :open="removeDialogOpen"
      title="حذف شرکت‌کننده"
      :description="`آیا مطمئن هستید که می‌خواهید «${pendingParticipant?.displayName ?? ''}» را از تورنمنت حذف کنید؟`"
      confirm-label="حذف"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onRemoveConfirm"
      @cancel="removeDialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { TournamentParticipantDto, ParticipantStatus } from '@dragon/types';
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.TOURNAMENT_PARTICIPANT_READ,
});
useHead({ title: 'مدیریت شرکت‌کنندگان — Dragon Admin' });

const PAGE_LIMIT = 20;

const route = useRoute();
const tournamentId = String(route.params['id']);

const { accessToken } = useAdminAuthState();
const { hasPermission } = useAdminPermissions();
const {
  participants,
  participantsPage,
  participantsLoading,
  participantsError,
  loadParticipants,
  updateParticipant,
  removeParticipant,
  disqualifyParticipant,
  actionLoading,
  actionError,
  actionSuccess,
  clearActionState,
} = useAdminTournamentParticipants();

const canManage = computed(() => hasPermission(Permissions.TOURNAMENT_PARTICIPANT_MANAGE));

const statusFilter = ref('');
const pendingParticipant = ref<TournamentParticipantDto | null>(null);

const editDialogOpen = ref(false);
const editDisplayName = ref('');
const editSeed = ref<number | null>(null);
const editError = ref<string | null>(null);

const disqualifyDialogOpen = ref(false);
const removeDialogOpen = ref(false);

const isEditValid = computed(() => editDisplayName.value.trim().length > 0);

function buildParams(page = 1) {
  return {
    page,
    limit: PAGE_LIMIT,
    ...(statusFilter.value ? { status: statusFilter.value as ParticipantStatus } : {}),
  };
}

async function load(page = 1) {
  clearActionState();
  await loadParticipants(tournamentId, buildParams(page));
}

function onFilterChange() {
  void load(1);
}

function goToPage(page: number) {
  void load(page);
}

function onEditRequest(p: TournamentParticipantDto) {
  pendingParticipant.value = p;
  editDisplayName.value = p.displayName;
  editSeed.value = p.seed ?? null;
  editError.value = null;
  editDialogOpen.value = true;
}

function onDisqualifyRequest(p: TournamentParticipantDto) {
  pendingParticipant.value = p;
  disqualifyDialogOpen.value = true;
}

function onRemoveRequest(p: TournamentParticipantDto) {
  pendingParticipant.value = p;
  removeDialogOpen.value = true;
}

async function onEditConfirm() {
  if (!pendingParticipant.value) return;
  editError.value = null;

  const input: { displayName?: string; seed?: number } = {};
  if (editDisplayName.value.trim()) input.displayName = editDisplayName.value.trim();
  if (editSeed.value !== null && editSeed.value > 0) input.seed = editSeed.value;

  const ok = await updateParticipant(tournamentId, pendingParticipant.value.id, input);
  if (ok) {
    editDialogOpen.value = false;
    pendingParticipant.value = null;
  } else {
    editError.value = actionError.value ?? 'خطا در ویرایش شرکت‌کننده.';
  }
}

async function onDisqualifyConfirm() {
  if (!pendingParticipant.value) return;
  const ok = await disqualifyParticipant(tournamentId, pendingParticipant.value.id);
  if (ok) {
    disqualifyDialogOpen.value = false;
    pendingParticipant.value = null;
  }
}

async function onRemoveConfirm() {
  if (!pendingParticipant.value) return;
  const ok = await removeParticipant(tournamentId, pendingParticipant.value.id);
  if (ok) {
    removeDialogOpen.value = false;
    pendingParticipant.value = null;
  }
}

onMounted(() => {
  if (hasPermission(Permissions.TOURNAMENT_PARTICIPANT_READ)) {
    void load();
  }
});
</script>

<style scoped>
.page {
  max-width: 1100px;
}

.filters {
  display: flex;
  gap: 8px;
  margin-block-end: 1.25rem;
  flex-wrap: wrap;
}

.filter-select {
  height: 36px;
  padding: 0 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: border-color var(--motion-fast);
}

.filter-select:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
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

.td-name {
  font-weight: 500;
  color: var(--text-primary);
}

.td-mono {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-seed {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

.td-actions {
  white-space: nowrap;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.type-badge--individual {
  background: rgba(109, 40, 217, 0.12);
  color: var(--purple-300);
}

.type-badge--team {
  background: rgba(6, 182, 212, 0.12);
  color: var(--cyan-400);
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

.action-btn--disqualify {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-400);
  border-color: rgba(245, 158, 11, 0.25);
}

.action-btn--disqualify:not(:disabled):hover {
  background: rgba(245, 158, 11, 0.18);
}

.action-btn--remove {
  background: rgba(239, 68, 68, 0.08);
  color: var(--danger-400);
  border-color: rgba(239, 68, 68, 0.25);
}

.action-btn--remove:not(:disabled):hover {
  background: rgba(239, 68, 68, 0.15);
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
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
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
  max-width: 440px;
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
  margin-block-end: 14px;
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
}

.field-input:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-block-start: 6px;
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
