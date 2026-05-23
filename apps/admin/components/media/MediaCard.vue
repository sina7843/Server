<template>
  <div
    class="card"
    :class="{ 'card--selected': selected }"
    role="button"
    tabindex="0"
    @click="$emit('select', asset)"
    @keydown.enter="$emit('select', asset)"
    @keydown.space.prevent="$emit('select', asset)"
  >
    <div class="card-thumb">
      <img
        v-if="asset.status === 'ready' && asset.url"
        :src="asset.url"
        :alt="asset.alt ?? asset.originalName"
        class="card-img"
        loading="lazy"
      />
      <div v-else class="card-placeholder">
        <span class="card-mime">{{ shortMime }}</span>
      </div>
    </div>

    <div class="card-body">
      <p class="card-name" :title="asset.originalName">{{ asset.originalName }}</p>
      <div class="card-meta">
        <MediaStatusBadge :status="asset.status" />
        <span class="card-size">{{ formattedSize }}</span>
      </div>
    </div>

    <div v-if="selected" class="card-check" aria-hidden="true">✓</div>
  </div>
</template>

<script setup lang="ts">
import type { AdminMediaAssetDto } from '@dragon/sdk';

const props = defineProps<{
  asset: AdminMediaAssetDto;
  selected?: boolean;
}>();

defineEmits<{
  select: [asset: AdminMediaAssetDto];
}>();

const shortMime = computed(() => {
  const parts = props.asset.mimeType.split('/');
  return parts[1]?.toUpperCase() ?? props.asset.mimeType;
});

const formattedSize = computed(() => {
  const b = props.asset.sizeBytes;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
});
</script>

<style scoped>
.card {
  position: relative;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  background: #fff;
}

.card:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px #bfdbfe;
}

.card--selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px #93c5fd;
}

.card-thumb {
  aspect-ratio: 4/3;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.card-mime {
  font-size: 0.75rem;
  font-weight: 700;
  color: #9ca3af;
  letter-spacing: 0.05em;
}

.card-body {
  padding: 0.5rem 0.625rem;
}

.card-name {
  font-size: 0.8rem;
  color: #111827;
  margin: 0 0 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-size {
  font-size: 0.7rem;
  color: #6b7280;
}

.card-check {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  background: #3b82f6;
  color: #fff;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
</style>
