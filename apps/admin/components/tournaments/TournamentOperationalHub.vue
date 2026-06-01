<template>
  <div class="hub">
    <!-- Header -->
    <div class="hub-header">
      <div class="hub-title-row">
        <h1 class="hub-title">{{ tournament.title }}</h1>
        <TournamentStatusBadge :status="tournament.status" />
      </div>
      <div class="hub-meta-row">
        <TournamentFormatBadge :format="tournament.format" />
        <span class="meta-cap">ظرفیت: {{ tournament.capacity }}</span>
        <span v-if="tournament.startsAt" class="meta-date">
          شروع: {{ formatDate(tournament.startsAt) }}
        </span>
      </div>
    </div>

    <!-- Action error -->
    <div v-if="actionError" class="action-error" role="alert">
      {{ actionError }}
    </div>

    <!-- Lifecycle actions -->
    <div class="hub-section">
      <h2 class="section-title">عملیات چرخه حیات</h2>
      <TournamentLifecycleActionButtons
        :status="tournament.status"
        :loading="actionLoading"
        :can-publish="canPublish"
        :can-cancel="canCancel"
        :can-archive="canArchive"
        @publish="onLifecycleAction('publish')"
        @open-registration="onLifecycleAction('openRegistration')"
        @close-registration="onLifecycleAction('closeRegistration')"
        @start="onLifecycleAction('start')"
        @complete="onLifecycleAction('complete')"
        @cancel="onLifecycleAction('cancel')"
        @archive="onLifecycleAction('archive')"
      />
      <p v-if="tournament.status === 'archived'" class="terminal-note">
        وضعیت بایگانی پایانی است — هیچ عملیات بیشتری مجاز نیست.
      </p>
    </div>

    <!-- Details -->
    <div class="hub-section">
      <h2 class="section-title">جزئیات</h2>
      <dl class="detail-list">
        <div class="detail-row">
          <dt class="detail-label">شناسه بازی</dt>
          <dd class="detail-value detail-value--mono">{{ tournament.gameId }}</dd>
        </div>
        <div class="detail-row">
          <dt class="detail-label">اسلاگ</dt>
          <dd class="detail-value detail-value--mono">{{ tournament.slug }}</dd>
        </div>
        <div v-if="tournament.description" class="detail-row">
          <dt class="detail-label">توضیحات</dt>
          <dd class="detail-value">{{ tournament.description }}</dd>
        </div>
        <div v-if="tournament.publishedAt" class="detail-row">
          <dt class="detail-label">تاریخ انتشار</dt>
          <dd class="detail-value">{{ formatDate(tournament.publishedAt) }}</dd>
        </div>
        <div v-if="tournament.cancelledAt" class="detail-row">
          <dt class="detail-label">تاریخ لغو</dt>
          <dd class="detail-value">{{ formatDate(tournament.cancelledAt) }}</dd>
        </div>
        <div v-if="tournament.archivedAt" class="detail-row">
          <dt class="detail-label">تاریخ بایگانی</dt>
          <dd class="detail-value">{{ formatDate(tournament.archivedAt) }}</dd>
        </div>
        <div class="detail-row">
          <dt class="detail-label">ایجاد</dt>
          <dd class="detail-value">{{ formatDate(tournament.createdAt) }}</dd>
        </div>
        <div class="detail-row">
          <dt class="detail-label">آخرین ویرایش</dt>
          <dd class="detail-value">{{ formatDate(tournament.updatedAt) }}</dd>
        </div>
      </dl>
    </div>

    <!-- Management actions -->
    <div class="hub-section hub-management">
      <NuxtLink
        v-if="canUpdate"
        :to="`/tournaments/${tournament.id}/edit`"
        class="mgmt-btn mgmt-btn--edit"
      >
        ویرایش اطلاعات
      </NuxtLink>
      <button
        v-if="canDelete"
        class="mgmt-btn mgmt-btn--delete"
        type="button"
        :disabled="actionLoading"
        @click="deleteDialogOpen = true"
      >
        حذف تورنمنت
      </button>
    </div>

    <!-- Lifecycle confirm dialog -->
    <ConfirmDialog
      :open="confirmDialog.open"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      :confirm-label="confirmDialog.confirmLabel"
      :destructive="confirmDialog.destructive"
      :loading="actionLoading"
      @confirm="onConfirm"
      @cancel="onCancelDialog"
    />

    <!-- Delete confirm dialog -->
    <ConfirmDialog
      :open="deleteDialogOpen"
      title="حذف تورنمنت"
      :description="`آیا مطمئن هستید که می‌خواهید تورنمنت «${tournament.title}» را حذف کنید؟`"
      confirm-label="حذف"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onDeleteConfirm"
      @cancel="deleteDialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';
import type { AdminTournamentDto } from '@dragon/types';

type LifecycleAction =
  | 'publish'
  | 'openRegistration'
  | 'closeRegistration'
  | 'start'
  | 'complete'
  | 'cancel'
  | 'archive';

const props = defineProps<{
  tournament: AdminTournamentDto;
  actionLoading: boolean;
  actionError: string | null;
}>();

const emit = defineEmits<{
  lifecycleAction: [action: LifecycleAction];
  delete: [];
}>();

const { hasPermission } = useAdminPermissions();

const canPublish = computed(() => hasPermission(Permissions.TOURNAMENT_PUBLISH));
const canCancel = computed(() => hasPermission(Permissions.TOURNAMENT_CANCEL));
const canArchive = computed(() => hasPermission(Permissions.TOURNAMENT_ARCHIVE));
const canUpdate = computed(() => hasPermission(Permissions.TOURNAMENT_UPDATE));
const canDelete = computed(() => hasPermission(Permissions.TOURNAMENT_ARCHIVE));

const deleteDialogOpen = ref(false);
const pendingAction = ref<LifecycleAction | null>(null);

interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
}

const CONFIRM_CONFIGS: Partial<Record<LifecycleAction, Omit<ConfirmDialogState, 'open'>>> = {
  cancel: {
    title: 'لغو تورنمنت',
    description:
      'آیا مطمئن هستید که می‌خواهید این تورنمنت را لغو کنید؟ این عملیات قابل بازگشت نیست.',
    confirmLabel: 'لغو تورنمنت',
    destructive: true,
  },
  archive: {
    title: 'بایگانی تورنمنت',
    description: 'آیا می‌خواهید این تورنمنت را بایگانی کنید؟',
    confirmLabel: 'بایگانی',
    destructive: false,
  },
};

const confirmDialog = reactive<ConfirmDialogState>({
  open: false,
  title: '',
  description: '',
  confirmLabel: 'تأیید',
  destructive: false,
});

function onLifecycleAction(action: LifecycleAction) {
  const config = CONFIRM_CONFIGS[action];
  if (config) {
    pendingAction.value = action;
    Object.assign(confirmDialog, { open: true, ...config });
  } else {
    emit('lifecycleAction', action);
  }
}

function onConfirm() {
  if (pendingAction.value) {
    emit('lifecycleAction', pendingAction.value);
  }
  confirmDialog.open = false;
  pendingAction.value = null;
}

function onCancelDialog() {
  confirmDialog.open = false;
  pendingAction.value = null;
}

function onDeleteConfirm() {
  deleteDialogOpen.value = false;
  emit('delete');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<style scoped>
.hub {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hub-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hub-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hub-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.hub-meta-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.meta-cap,
.meta-date {
  font-size: 0.85rem;
  color: #64748b;
}

.action-error {
  font-size: 0.875rem;
  color: #dc2626;
  background: #fee2e2;
  padding: 0.6rem 0.85rem;
  border-radius: 0.4rem;
}

.hub-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.section-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.terminal-note {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  font-style: italic;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
  min-width: 120px;
  flex-shrink: 0;
}

.detail-value {
  color: #475569;
}

.detail-value--mono {
  font-family: monospace;
  color: #64748b;
  font-size: 0.8rem;
}

.hub-management {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.mgmt-btn {
  padding: 0.45rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  border: 1px solid transparent;
}

.mgmt-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.mgmt-btn--edit {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.mgmt-btn--edit:hover {
  background: #dbeafe;
}

.mgmt-btn--delete {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

.mgmt-btn--delete:not(:disabled):hover {
  background: #fee2e2;
}
</style>
