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
  gap: 1rem;
  padding: 3rem;
  color: #64748b;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.state-label {
  margin: 0;
  font-size: 0.9rem;
}
</style>
