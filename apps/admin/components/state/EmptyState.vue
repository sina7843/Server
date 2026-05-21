<template>
  <div class="state-container">
    <p class="state-icon" aria-hidden="true">—</p>
    <p class="state-label">{{ label }}</p>
    <p v-if="hint" class="state-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    hint?: string;
  }>(),
  { label: 'موردی یافت نشد.' },
);
</script>

<style scoped>
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem;
  color: #64748b;
}

.state-icon {
  margin: 0;
  font-size: 2rem;
  color: #cbd5e1;
}

.state-label {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
}

.state-hint {
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
}
</style>
