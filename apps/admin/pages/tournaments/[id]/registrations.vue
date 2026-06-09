<template>
  <div class="page">
    <TournamentNavBar />

    <UnauthorizedState v-if="!accessToken" />

    <ForbiddenState v-else-if="!hasPermission(Permissions.TOURNAMENT_REGISTRATION_READ)" />

    <template v-else>
      <!-- Filters -->
      <div class="filters">
        <select v-model="statusFilter" class="filter-select" @change="onFilterChange">
          <option value="">همه وضعیت‌ها</option>
          <option value="submitted">در انتظار</option>
          <option value="approved">تأیید شده</option>
          <option value="rejected">رد شده</option>
          <option value="waitlisted">لیست انتظار</option>
          <option value="withdrawn">انصراف داده</option>
          <option value="cancelled">لغو شده</option>
        </select>
        <select v-model="typeFilter" class="filter-select" @change="onFilterChange">
          <option value="">همه انواع</option>
          <option value="individual">فردی</option>
          <option value="team">تیمی</option>
        </select>
      </div>

      <!-- Action feedback -->
      <div v-if="actionSuccess" class="alert alert--success" role="status">
        {{ actionSuccess }}
      </div>
      <div v-if="actionError" class="alert alert--error" role="alert">
        {{ actionError }}
      </div>

      <LoadingState v-if="registrationsLoading" />
      <ErrorState v-else-if="registrationsError" :message="registrationsError" @retry="load" />
      <EmptyState v-else-if="registrations.length === 0" label="هیچ ثبت‌نامی یافت نشد." />

      <template v-else>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>نوع</th>
                <th>وضعیت</th>
                <th>تاریخ ثبت‌نام</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="reg in registrations"
                :key="reg.id"
                class="table-row"
                :class="{ 'table-row--selected': selectedRegistration?.id === reg.id }"
                @click="onRowClick(reg)"
              >
                <td class="td-mono">{{ reg.userId }}</td>
                <td>
                  <span class="type-badge" :class="`type-badge--${reg.type}`">
                    {{ reg.type === 'individual' ? 'فردی' : 'تیمی' }}
                  </span>
                </td>
                <td>
                  <RegistrationStatusBadge :status="reg.status" />
                </td>
                <td class="td-date">{{ formatDate(reg.registeredAt) }}</td>
                <td class="td-actions" @click.stop>
                  <button
                    v-if="canManage && reg.status === 'submitted'"
                    class="action-btn action-btn--approve"
                    type="button"
                    :disabled="actionLoading"
                    @click="onApproveRequest(reg)"
                  >
                    تأیید
                  </button>
                  <button
                    v-if="canManage && reg.status === 'submitted'"
                    class="action-btn action-btn--reject"
                    type="button"
                    :disabled="actionLoading"
                    @click="onRejectRequest(reg)"
                  >
                    رد
                  </button>
                  <button
                    v-if="canManage && (reg.status === 'submitted' || reg.status === 'approved')"
                    class="action-btn action-btn--cancel"
                    type="button"
                    :disabled="actionLoading"
                    @click="onCancelRequest(reg)"
                  >
                    لغو
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
            :disabled="registrationsPage <= 1"
            @click="goToPage(registrationsPage - 1)"
          >
            قبلی
          </button>
          <span class="page-info">صفحه {{ registrationsPage }}</span>
          <button
            class="page-btn"
            type="button"
            :disabled="registrations.length < PAGE_LIMIT"
            @click="goToPage(registrationsPage + 1)"
          >
            بعدی
          </button>
        </div>
      </template>
    </template>

    <!-- Detail panel -->
    <div v-if="selectedRegistration" class="detail-panel">
      <div class="panel-header">
        <h2 class="panel-title">جزئیات ثبت‌نام</h2>
        <button class="panel-close" type="button" @click="selectedRegistration = null">✕</button>
      </div>

      <LoadingState v-if="registrationLoading" />
      <ErrorState
        v-else-if="registrationError"
        :message="registrationError"
        @retry="() => loadRegistration(tournamentId, selectedRegistration!.id)"
      />

      <template v-else-if="registration">
        <dl class="detail-list">
          <div class="detail-row">
            <dt class="detail-label">شناسه</dt>
            <dd class="detail-value detail-value--mono">{{ registration.id }}</dd>
          </div>
          <div class="detail-row">
            <dt class="detail-label">کاربر</dt>
            <dd class="detail-value detail-value--mono">{{ registration.userId }}</dd>
          </div>
          <div class="detail-row">
            <dt class="detail-label">نوع</dt>
            <dd class="detail-value">{{ registration.type === 'individual' ? 'فردی' : 'تیمی' }}</dd>
          </div>
          <div class="detail-row">
            <dt class="detail-label">وضعیت</dt>
            <dd class="detail-value">
              <RegistrationStatusBadge :status="registration.status" />
            </dd>
          </div>
          <template v-if="registration.type === 'team'">
            <div v-if="registration.teamName" class="detail-row">
              <dt class="detail-label">نام تیم</dt>
              <dd class="detail-value">{{ registration.teamName }}</dd>
            </div>
            <div v-if="registration.members && registration.members.length > 0" class="detail-row">
              <dt class="detail-label">اعضا</dt>
              <dd class="detail-value">
                <ul class="members-list">
                  <li v-for="(member, i) in registration.members" :key="i" class="member-item">
                    {{ member.displayName }}
                    <span v-if="member.role" class="member-role">({{ member.role }})</span>
                  </li>
                </ul>
              </dd>
            </div>
          </template>
          <div class="detail-row">
            <dt class="detail-label">تاریخ ثبت‌نام</dt>
            <dd class="detail-value">{{ formatDate(registration.registeredAt) }}</dd>
          </div>
          <div class="detail-row">
            <dt class="detail-label">آخرین ویرایش</dt>
            <dd class="detail-value">{{ formatDate(registration.updatedAt) }}</dd>
          </div>
        </dl>
      </template>
    </div>

    <!-- Approve dialog -->
    <ConfirmDialog
      :open="approveDialogOpen"
      title="تأیید ثبت‌نام"
      :description="`آیا مطمئن هستید که می‌خواهید این ثبت‌نام را تأیید کنید؟`"
      confirm-label="تأیید"
      :destructive="false"
      :loading="actionLoading"
      @confirm="onApproveConfirm"
      @cancel="approveDialogOpen = false"
    />

    <!-- Reject dialog -->
    <Teleport to="body">
      <div v-if="rejectDialogOpen" class="overlay" role="dialog" aria-modal="true">
        <div class="dialog">
          <h2 class="dialog-title">رد ثبت‌نام</h2>
          <p class="dialog-desc">آیا مطمئن هستید که می‌خواهید این ثبت‌نام را رد کنید؟</p>
          <div class="field">
            <label class="field-label" for="reject-reason">دلیل (اختیاری)</label>
            <input
              id="reject-reason"
              v-model="rejectReason"
              class="field-input"
              type="text"
              placeholder="دلیل رد ثبت‌نام را وارد کنید"
            />
          </div>
          <div class="dialog-actions">
            <button
              class="btn btn-cancel"
              type="button"
              :disabled="actionLoading"
              @click="rejectDialogOpen = false"
            >
              انصراف
            </button>
            <button
              class="btn btn-destructive"
              type="button"
              :disabled="actionLoading"
              @click="onRejectConfirm"
            >
              <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
              رد ثبت‌نام
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Cancel dialog -->
    <ConfirmDialog
      :open="cancelDialogOpen"
      title="لغو ثبت‌نام"
      description="آیا مطمئن هستید که می‌خواهید این ثبت‌نام را لغو کنید؟"
      confirm-label="لغو ثبت‌نام"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onCancelConfirm"
      @cancel="cancelDialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { AdminTournamentRegistrationDto, RegistrationStatus } from '@dragon/types';
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.TOURNAMENT_REGISTRATION_READ,
});
useHead({ title: 'مدیریت ثبت‌نام‌ها — Dragon Admin' });

const PAGE_LIMIT = 20;

const route = useRoute();
const tournamentId = String(route.params['id']);

const { accessToken } = useAdminAuthState();
const { hasPermission } = useAdminPermissions();
const {
  registrations,
  registrationsPage,
  registrationsLoading,
  registrationsError,
  loadRegistrations,
  registration,
  registrationLoading,
  registrationError,
  loadRegistration,
  approveRegistration,
  rejectRegistration,
  cancelRegistration,
  actionLoading,
  actionError,
  actionSuccess,
  clearActionState,
} = useAdminTournamentRegistrations();

const canManage = computed(() => hasPermission(Permissions.TOURNAMENT_REGISTRATION_MANAGE));

const statusFilter = ref('');
const typeFilter = ref('');
const selectedRegistration = ref<AdminTournamentRegistrationDto | null>(null);
const approveDialogOpen = ref(false);
const rejectDialogOpen = ref(false);
const cancelDialogOpen = ref(false);
const rejectReason = ref('');
const pendingRegistration = ref<AdminTournamentRegistrationDto | null>(null);

function buildParams(page = 1) {
  return {
    page,
    limit: PAGE_LIMIT,
    ...(statusFilter.value ? { status: statusFilter.value as RegistrationStatus } : {}),
    ...(typeFilter.value ? { type: typeFilter.value as 'individual' | 'team' } : {}),
  };
}

async function load(page = 1) {
  clearActionState();
  await loadRegistrations(tournamentId, buildParams(page));
}

function onFilterChange() {
  void load(1);
}

function goToPage(page: number) {
  void load(page);
}

function onRowClick(reg: AdminTournamentRegistrationDto) {
  if (selectedRegistration.value?.id === reg.id) {
    selectedRegistration.value = null;
    return;
  }
  selectedRegistration.value = reg;
  void loadRegistration(tournamentId, reg.id);
}

function onApproveRequest(reg: AdminTournamentRegistrationDto) {
  pendingRegistration.value = reg;
  approveDialogOpen.value = true;
}

function onRejectRequest(reg: AdminTournamentRegistrationDto) {
  pendingRegistration.value = reg;
  rejectReason.value = '';
  rejectDialogOpen.value = true;
}

function onCancelRequest(reg: AdminTournamentRegistrationDto) {
  pendingRegistration.value = reg;
  cancelDialogOpen.value = true;
}

async function onApproveConfirm() {
  if (!pendingRegistration.value) return;
  const ok = await approveRegistration(tournamentId, pendingRegistration.value.id);
  if (ok) {
    approveDialogOpen.value = false;
    pendingRegistration.value = null;
  }
}

async function onRejectConfirm() {
  if (!pendingRegistration.value) return;
  const input = rejectReason.value.trim() ? { reason: rejectReason.value.trim() } : undefined;
  const ok = await rejectRegistration(tournamentId, pendingRegistration.value.id, input);
  if (ok) {
    rejectDialogOpen.value = false;
    rejectReason.value = '';
    pendingRegistration.value = null;
  }
}

async function onCancelConfirm() {
  if (!pendingRegistration.value) return;
  const ok = await cancelRegistration(tournamentId, pendingRegistration.value.id);
  if (ok) {
    cancelDialogOpen.value = false;
    pendingRegistration.value = null;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

onMounted(() => {
  if (hasPermission(Permissions.TOURNAMENT_REGISTRATION_READ)) {
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
  cursor: pointer;
  transition: background var(--motion-fast);
}

.table-row:hover {
  background: var(--hover-overlay);
}

.table-row--selected {
  background: rgba(109, 40, 217, 0.08) !important;
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

.td-date {
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
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

.action-btn--approve {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-400);
  border-color: rgba(16, 185, 129, 0.25);
}

.action-btn--approve:not(:disabled):hover {
  background: rgba(16, 185, 129, 0.18);
}

.action-btn--reject {
  background: rgba(239, 68, 68, 0.08);
  color: var(--danger-400);
  border-color: rgba(239, 68, 68, 0.25);
}

.action-btn--reject:not(:disabled):hover {
  background: rgba(239, 68, 68, 0.15);
}

.action-btn--cancel {
  background: var(--hover-overlay);
  color: var(--text-muted);
  border-color: var(--border-default);
}

.action-btn--cancel:not(:disabled):hover {
  background: var(--hover-overlay-strong);
  color: var(--text-secondary);
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

.detail-panel {
  position: fixed;
  inset-block: 0;
  inset-inline-end: 0;
  width: 360px;
  background: var(--surface-elevated);
  border-inline-start: 1px solid var(--border-default);
  box-shadow: var(--shadow-lg);
  overflow-y: auto;
  padding: 24px;
  z-index: var(--z-dropdown);
  backdrop-filter: blur(20px);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 20px;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.panel-close {
  background: var(--hover-overlay);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px 8px;
  transition: all var(--motion-fast);
}

.panel-close:hover {
  color: var(--text-primary);
  background: var(--hover-overlay-strong);
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
}

.detail-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
  padding: 8px 0;
  border-block-end: 1px solid var(--border-subtle);
}

.detail-row:last-child {
  border-block-end: none;
}

.detail-label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 100px;
  flex-shrink: 0;
  font-size: 12px;
}

.detail-value {
  color: var(--text-primary);
}

.detail-value--mono {
  font-family: var(--font-mono);
  color: var(--text-muted);
  font-size: 11px;
  word-break: break-all;
}

.members-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-item {
  font-size: 13px;
  color: var(--text-secondary);
}

.member-role {
  font-size: 11px;
  color: var(--text-muted);
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
  line-height: 1.6;
}

.field {
  margin-block-end: 16px;
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

.btn-destructive {
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger-400);
  border-color: rgba(239, 68, 68, 0.35);
}

.btn-destructive:not(:disabled):hover {
  background: rgba(239, 68, 68, 0.22);
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
