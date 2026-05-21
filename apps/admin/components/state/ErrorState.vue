<template>
  <div class="state-container" role="alert">
    <p class="state-icon" aria-hidden="true">!</p>
    <p class="state-label">{{ label }}</p>
    <p v-if="message" class="state-message">{{ message }}</p>
    <button v-if="onRetry" class="retry-btn" type="button" @click="onRetry">تلاش مجدد</button>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    message?: string;
    onRetry?: (() => void) | null;
  }>(),
  { label: 'خطایی رخ داد.', onRetry: null },
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
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 50%;
  font-weight: 700;
}

.state-label {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: #dc2626;
}

.state-message {
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.retry-btn {
  margin-block-start: 0.5rem;
  padding: 0.4rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  color: #374151;
}

.retry-btn:hover {
  background: #f8fafc;
}
</style>
