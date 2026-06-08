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
  cursor: pointer;
  transition: background 0.1s;
}

.table-row:hover {
  background: #f8fafc;
}

.table-row--selected {
  background: #eff6ff;
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

.td-date {
  white-space: nowrap;
  font-size: 0.82rem;
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

.action-btn--approve {
  background: #dcfce7;
  color: #166534;
}

.action-btn--approve:not(:disabled):hover {
  background: #bbf7d0;
}

.action-btn--reject {
  background: #fee2e2;
  color: #991b1b;
}

.action-btn--reject:not(:disabled):hover {
  background: #fecaca;
}

.action-btn--cancel {
  background: #f1f5f9;
  color: #475569;
}

.action-btn--cancel:not(:disabled):hover {
  background: #e2e8f0;
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

/* Detail panel */
.detail-panel {
  position: fixed;
  inset-block: 0;
  inset-inline-end: 0;
  width: 360px;
  background: #fff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  padding: 1.5rem;
  z-index: 200;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 1.25rem;
}

.panel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.panel-close {
  background: none;
  border: none;
  font-size: 1rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.panel-close:hover {
  color: #1e293b;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.detail-label {
  font-weight: 600;
  color: #374151;
  min-width: 100px;
  flex-shrink: 0;
}

.detail-value {
  color: #475569;
}

.detail-value--mono {
  font-family: monospace;
  color: #64748b;
  font-size: 0.78rem;
  word-break: break-all;
}

.members-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.member-item {
  font-size: 0.85rem;
  color: #475569;
}

.member-role {
  font-size: 0.78rem;
  color: #94a3b8;
}

/* Reject dialog overlay */
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
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.dialog-desc {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.6;
}

.field {
  margin-block-end: 1.25rem;
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

.btn-destructive {
  background: #ef4444;
  color: #fff;
}

.btn-destructive:not(:disabled):hover {
  background: #dc2626;
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
