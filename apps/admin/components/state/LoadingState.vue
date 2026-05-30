<template>
  <div class="state-container" role="status" aria-busy="true">
    <div class="spinner" aria-hidden="true" />
    <p class="state-label">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
  }>(),
  { label: 'در حال بارگذاری…' },
);
</script>

<style scoped>
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 48px 24px;
  color: var(--text-muted);
}

.spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--glass-border-strong);
  border-top-color: var(--purple-400);
  animation: dr-spin 0.8s linear infinite;
}

.state-label {
  margin: 0;
  font-size: var(--text-body-sm-size);
  color: var(--text-muted);
}
</style>
