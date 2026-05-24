<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="انتخاب رسانه"
      @click.self="$emit('cancel')"
    >
      <div class="dialog">
        <div class="dialog-header">
          <h2 class="dialog-title">انتخاب رسانه</h2>
          <button class="close-btn" type="button" aria-label="بستن" @click="$emit('cancel')">
            ×
          </button>
        </div>

        <div class="dialog-tabs">
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'library' }"
            type="button"
            @click="activeTab = 'library'"
          >
            کتابخانه
          </button>
          <button
            v-if="canUpload"
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'upload' }"
            type="button"
            @click="activeTab = 'upload'"
          >
            آپلود جدید
          </button>
        </div>

        <div class="dialog-body">
          <template v-if="activeTab === 'library'">
            <div class="library-filters">
              <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
                <option value="">همه وضعیت‌ها</option>
                <option value="ready">آماده</option>
                <option value="processing">در پردازش</option>
              </select>
            </div>

            <MediaGrid
              :assets="assets"
              :total="assetsTotal"
              :page="assetsPage"
              :limit="assetsLimit"
              :loading="assetsLoading"
              :error="assetsError"
              :selected-id="selectedAsset?.id ?? null"
              @select="selectedAsset = $event"
              @page-change="onPageChange"
            />
          </template>

          <template v-else>
            <MediaUploadForm @uploaded="onUploaded">
              <template #cancel>
                <button type="button" class="cancel-btn" @click="$emit('cancel')">انصراف</button>
              </template>
            </MediaUploadForm>
          </template>
        </div>

        <div v-if="activeTab === 'library'" class="dialog-footer">
          <button type="button" class="cancel-btn" @click="$emit('cancel')">انصراف</button>
          <button
            type="button"
            class="select-btn"
            :disabled="!selectedAsset"
            @click="onConfirmSelect"
          >
            انتخاب
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { AdminMediaAssetDto } from '@dragon/sdk';
import { DragonPermissions as Permissions } from '@dragon/sdk';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  select: [asset: AdminMediaAssetDto];
  cancel: [];
}>();

const { hasPermission } = useAdminPermissions();
const canUpload = computed(() => hasPermission(Permissions.MEDIA_ASSET_UPLOAD));

const { assets, assetsTotal, assetsPage, assetsLimit, assetsLoading, assetsError, loadMedia } =
  useAdminMedia();

const activeTab = ref<'library' | 'upload'>('library');
const selectedAsset = ref<AdminMediaAssetDto | null>(null);
const filterStatus = ref('');

watch(
  () => props.open,
  (open) => {
    if (open) {
      selectedAsset.value = null;
      activeTab.value = 'library';
      void loadMedia({ status: 'ready', limit: 24 });
    }
  },
);

function onFilterChange() {
  const params: Record<string, unknown> = { limit: 24, page: 1 };
  if (filterStatus.value) params.status = filterStatus.value;
  void loadMedia(params as Parameters<typeof loadMedia>[0]);
}

function onPageChange(page: number) {
  const params: Record<string, unknown> = { limit: 24, page };
  if (filterStatus.value) params.status = filterStatus.value;
  void loadMedia(params as Parameters<typeof loadMedia>[0]);
}

function onUploaded(asset: AdminMediaAssetDto) {
  emit('select', asset);
}

function onConfirmSelect() {
  if (selectedAsset.value) {
    emit('select', selectedAsset.value);
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.dialog {
  background: #fff;
  border-radius: 0.75rem;
  width: min(860px, 100%);
  max-height: min(80vh, 680px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: none;
  color: #9ca3af;
  font-size: 1.4rem;
  cursor: pointer;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.dialog-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 1.25rem;
}

.tab-btn {
  padding: 0.6rem 1rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  margin-bottom: -1px;
}

.tab-btn--active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  font-weight: 500;
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.library-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-select {
  padding: 0.35rem 0.65rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  background: #fff;
  color: #374151;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  padding: 0.45rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: #fff;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #f3f4f6;
}

.select-btn {
  padding: 0.45rem 1.25rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.select-btn:hover:not(:disabled) {
  background: #2563eb;
}

.select-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
