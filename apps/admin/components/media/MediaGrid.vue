<template>
  <div>
    <div v-if="loading" class="grid-loading">در حال بارگذاری…</div>

    <div v-else-if="error" class="grid-error">{{ error }}</div>

    <div v-else-if="assets.length === 0" class="grid-empty">
      <p>هیچ رسانه‌ای یافت نشد.</p>
    </div>

    <div v-else class="grid">
      <MediaCard
        v-for="asset in assets"
        :key="asset.id"
        :asset="asset"
        :selected="selectedId === asset.id"
        @select="$emit('select', $event)"
      />
    </div>

    <div v-if="!loading && total > 0" class="grid-pagination">
      <button class="page-btn" :disabled="page <= 1" @click="$emit('page-change', page - 1)">
        قبلی
      </button>
      <span class="page-info">صفحه {{ page }} از {{ totalPages }}</span>
      <button
        class="page-btn"
        :disabled="page >= totalPages"
        @click="$emit('page-change', page + 1)"
      >
        بعدی
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminMediaAssetDto } from '@dragon/sdk';

const props = defineProps<{
  assets: readonly AdminMediaAssetDto[];
  total: number;
  page: number;
  limit: number;
  loading?: boolean;
  error?: string | null;
  selectedId?: string | null;
}>();

defineEmits<{
  select: [asset: AdminMediaAssetDto];
  'page-change': [page: number];
}>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.limit)));
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.grid-loading,
.grid-empty {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
}

.grid-error {
  padding: 1rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.grid-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-block-start: 1.5rem;
}

.page-btn {
  padding: 0.35rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  color: #374151;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.85rem;
  color: #6b7280;
}
</style>
