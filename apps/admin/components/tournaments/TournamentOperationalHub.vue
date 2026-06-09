<template>
  <div class="hub">
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

      <!-- Poster preview -->
      <div v-if="tournament.coverImageUrl || tournament.gameCoverImageUrl" class="poster-preview">
        <img
          :src="tournament.coverImageUrl ?? tournament.gameCoverImageUrl"
          :alt="tournament.title"
          class="poster-img"
        />
        <span v-if="!tournament.coverImageUrl" class="poster-fallback-label">تصویر بازی (پوستر اختصاصی ندارد)</span>
      </div>

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
  gap: 20px;
}

.action-error {
  font-size: 13.5px;
  color: var(--danger-400);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
}

.hub-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
}

.section-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-sans-en);
}

.terminal-note {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
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
  align-items: baseline;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13.5px;
}

.detail-row:last-child {
  border-bottom: 0;
}

.detail-label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 120px;
  flex-shrink: 0;
  font-size: 13px;
}

.detail-value {
  color: var(--text-primary);
}

.detail-value--mono {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
}

.hub-management {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
}

.mgmt-btn {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--motion-fast);
  text-decoration: none;
  border: 1px solid transparent;
  font-family: inherit;
}

.mgmt-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.mgmt-btn--edit {
  background: rgba(109, 40, 217, 0.1);
  color: var(--purple-300);
  border-color: rgba(109, 40, 217, 0.3);
}

.mgmt-btn--edit:hover {
  background: rgba(109, 40, 217, 0.2);
  border-color: rgba(109, 40, 217, 0.5);
}

.mgmt-btn--delete {
  background: rgba(239, 68, 68, 0.08);
  color: var(--danger-400);
  border-color: rgba(239, 68, 68, 0.3);
}

.mgmt-btn--delete:not(:disabled):hover {
  background: rgba(239, 68, 68, 0.16);
  border-color: rgba(239, 68, 68, 0.5);
}

.poster-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.poster-img {
  width: 100%;
  max-height: 160px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.poster-fallback-label {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
}
</style>
