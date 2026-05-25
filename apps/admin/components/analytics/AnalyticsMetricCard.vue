<template>
  <div class="metric-card">
    <span class="metric-label">{{ label }}</span>
    <span v-if="loading" class="metric-value metric-loading" aria-label="در حال بارگذاری">…</span>
    <span v-else-if="error" class="metric-error" :title="error" role="alert">!</span>
    <span v-else class="metric-value">{{ value ?? 0 }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value?: number | null;
  loading?: boolean;
  error?: string | null;
}>();
</script>

<style scoped>
.metric-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #fff;
  min-width: 140px;
}

.metric-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.metric-loading {
  color: #94a3b8;
  font-size: 1.5rem;
}

.metric-error {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: default;
}
</style>
