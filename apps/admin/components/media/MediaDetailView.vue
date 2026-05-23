<template>
  <div class="detail">
    <div class="detail-preview">
      <img
        v-if="asset.status === 'ready' && asset.url"
        :src="asset.url"
        :alt="asset.alt ?? asset.originalName"
        class="detail-img"
      />
      <div v-else class="detail-placeholder">
        <MediaStatusBadge :status="asset.status" />
      </div>
    </div>

    <div class="detail-meta">
      <dl class="meta-list">
        <div class="meta-row">
          <dt>نام اصلی</dt>
          <dd>{{ asset.originalName }}</dd>
        </div>
        <div class="meta-row">
          <dt>نوع فایل</dt>
          <dd>{{ asset.mimeType }}</dd>
        </div>
        <div class="meta-row">
          <dt>حجم</dt>
          <dd>{{ formattedSize }}</dd>
        </div>
        <div v-if="asset.width && asset.height" class="meta-row">
          <dt>ابعاد</dt>
          <dd>{{ asset.width }} × {{ asset.height }}</dd>
        </div>
        <div class="meta-row">
          <dt>وضعیت</dt>
          <dd><MediaStatusBadge :status="asset.status" /></dd>
        </div>
        <div class="meta-row">
          <dt>نمایش</dt>
          <dd>{{ asset.visibility === 'public' ? 'عمومی' : 'خصوصی' }}</dd>
        </div>
        <div class="meta-row">
          <dt>آپلود</dt>
          <dd>{{ formattedDate }}</dd>
        </div>
      </dl>
    </div>

    <form v-if="canEdit" class="detail-edit" @submit.prevent="onSave">
      <div class="field">
        <label class="field-label">نمایش</label>
        <select v-model="form.visibility" class="field-select">
          <option value="public">عمومی</option>
          <option value="private">خصوصی</option>
        </select>
      </div>

      <div class="field">
        <label class="field-label">متن جایگزین (alt)</label>
        <input v-model="form.alt" class="field-input" type="text" maxlength="500" />
      </div>

      <div class="field">
        <label class="field-label">کپشن</label>
        <input v-model="form.caption" class="field-input" type="text" maxlength="500" />
      </div>

      <div v-if="actionError" class="form-error">{{ actionError }}</div>
      <div v-if="actionSuccess" class="form-success">{{ actionSuccess }}</div>

      <div class="detail-actions">
        <button
          v-if="canRegenerate && asset.mimeType !== 'image/gif'"
          type="button"
          class="action-btn action-btn--secondary"
          :disabled="actionLoading"
          @click="onRegenerate"
        >
          بازسازی واریانت‌ها
        </button>
        <button
          v-if="canDelete"
          type="button"
          class="action-btn action-btn--danger"
          :disabled="actionLoading"
          @click="deleteDialogOpen = true"
        >
          حذف
        </button>
        <button class="action-btn action-btn--primary" type="submit" :disabled="actionLoading">
          <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
          ذخیره
        </button>
      </div>
    </form>

    <div v-if="asset.variants && asset.variants.length > 1" class="variants">
      <h3 class="variants-title">واریانت‌ها</h3>
      <div class="variants-list">
        <div v-for="v in asset.variants" :key="v.objectKey" class="variant-row">
          <span class="variant-type">{{ VARIANT_LABELS[v.type] ?? v.type }}</span>
          <span v-if="v.width && v.height" class="variant-dim">{{ v.width }} × {{ v.height }}</span>
          <span v-if="v.sizeBytes" class="variant-size">{{ formatBytes(v.sizeBytes) }}</span>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :open="deleteDialogOpen"
      title="حذف رسانه"
      description="این رسانه حذف می‌شود (نرم‌حذف). آیا مطمئن هستید؟"
      confirm-label="حذف"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onConfirmDelete"
      @cancel="deleteDialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { AdminMediaAssetDto } from '@dragon/sdk';
import { DragonPermissions as Permissions } from '@dragon/sdk';

const props = defineProps<{
  asset: AdminMediaAssetDto;
}>();

const emit = defineEmits<{
  deleted: [];
}>();

const { hasPermission } = useAdminPermissions();
const {
  updateAsset,
  regenerateVariants,
  deleteAsset,
  actionLoading,
  actionError,
  actionSuccess,
  clearActionState,
} = useAdminMedia();
const router = useRouter();

const canEdit = computed(() => hasPermission(Permissions.MEDIA_ASSET_UPDATE));
const canDelete = computed(() => hasPermission(Permissions.MEDIA_ASSET_DELETE));
const canRegenerate = computed(() => hasPermission(Permissions.MEDIA_ASSET_REGENERATE));

const deleteDialogOpen = ref(false);

const VARIANT_LABELS: Record<string, string> = {
  original: 'اصلی',
  thumbnail: 'بند انگشتی',
  medium: 'متوسط',
};

const form = reactive({
  visibility: props.asset.visibility as 'public' | 'private',
  alt: props.asset.alt ?? '',
  caption: props.asset.caption ?? '',
});

const formattedSize = computed(() => formatBytes(props.asset.sizeBytes));

const formattedDate = computed(() => new Date(props.asset.createdAt).toLocaleDateString('fa-IR'));

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

async function onSave() {
  clearActionState();
  await updateAsset(props.asset.id, {
    visibility: form.visibility,
    ...(form.alt.trim() ? { alt: form.alt.trim() } : {}),
    ...(form.caption.trim() ? { caption: form.caption.trim() } : {}),
  });
}

async function onRegenerate() {
  clearActionState();
  await regenerateVariants(props.asset.id);
}

async function onConfirmDelete() {
  deleteDialogOpen.value = false;
  const ok = await deleteAsset(props.asset.id);
  if (ok) emit('deleted');
}
</script>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.detail-preview {
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f3f4f6;
  max-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-img {
  max-width: 100%;
  max-height: 320px;
  object-fit: contain;
}

.detail-placeholder {
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meta-list {
  display: grid;
  gap: 0.4rem;
  margin: 0;
}

.meta-row {
  display: grid;
  grid-template-columns: 8rem 1fr;
  gap: 0.5rem;
  align-items: baseline;
  font-size: 0.875rem;
}

.meta-row dt {
  color: #6b7280;
  font-weight: 500;
}

.meta-row dd {
  margin: 0;
  color: #111827;
}

.detail-edit {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

.field-input,
.field-select {
  padding: 0.45rem 0.65rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  background: #fff;
}

.field-input:focus,
.field-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px #bfdbfe;
}

.form-error {
  padding: 0.5rem 0.75rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.375rem;
  font-size: 0.85rem;
}

.form-success {
  padding: 0.5rem 0.75rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 0.375rem;
  font-size: 0.85rem;
}

.detail-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.4rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.action-btn--primary {
  background: #3b82f6;
  color: #fff;
}

.action-btn--primary:hover:not(:disabled) {
  background: #2563eb;
}

.action-btn--secondary {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}

.action-btn--secondary:hover:not(:disabled) {
  background: #f3f4f6;
}

.action-btn--danger {
  background: #fff;
  color: #dc2626;
  border-color: #fca5a5;
}

.action-btn--danger:hover:not(:disabled) {
  background: #fee2e2;
}

.variants {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.variants-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem;
}

.variants-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.variant-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
  padding: 0.25rem 0;
}

.variant-type {
  font-weight: 500;
  color: #374151;
  min-width: 5rem;
}

.variant-dim,
.variant-size {
  color: #6b7280;
}

.btn-spinner {
  display: inline-block;
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
