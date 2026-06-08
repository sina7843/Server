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
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e2e8f0;
}

.table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
  vertical-align: middle;
}

.table-row {
  transition: background 0.1s;
}

.table-row:hover {
  background: #f8fafc;
}

.td-name {
  font-weight: 500;
  color: #1e293b;
}

.td-mono {
  font-family: monospace;
  font-size: 0.78rem;
  color: #64748b;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-seed {
  text-align: center;
  font-size: 0.82rem;
  color: #64748b;
}

.td-actions {
  white-space: nowrap;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.type-badge--individual {
  background: #dbeafe;
  color: #1d4ed8;
}

.type-badge--team {
  background: #ede9fe;
  color: #5b21b6;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
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

.action-btn--disqualify {
  background: #fef9c3;
  color: #854d0e;
}

.action-btn--disqualify:not(:disabled):hover {
  background: #fef08a;
}

.action-btn--remove {
  background: #fee2e2;
  color: #991b1b;
}

.action-btn--remove:not(:disabled):hover {
  background: #fecaca;
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

/* Edit dialog overlay */
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
  max-width: 440px;
  width: calc(100% - 2rem);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.dialog-title {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.dialog-desc {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: #64748b;
}

.field {
  margin-block-end: 1rem;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-block-end: 0.4rem;
}

.field-input {
  width: 100%;
  padding: 0.45rem 0.75rem;
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
  margin-block-start: 0.25rem;
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
