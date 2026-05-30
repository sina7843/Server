<template>
  <div class="state-container" role="alert">
    <div class="state-icon" aria-hidden="true">!</div>
    <p class="state-label">{{ label }}</p>
    <p v-if="message" class="state-message">{{ message }}</p>
    <button v-if="onRetry" class="dr-btn dr-btn-secondary dr-btn-sm retry-btn" type="button" @click="onRetry">
      تلاش مجدد
    </button>
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
  gap: 10px;
  padding: 48px 24px;
}

.state-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--danger-400);
  border-radius: 50%;
  font-weight: 700;
  font-size: 18px;
}

.state-label {
  margin: 0;
  font-size: var(--text-body-sm-size);
  font-weight: var(--weight-medium);
  color: var(--danger-400);
}

.state-message {
  margin: 0;
  font-size: var(--text-caption-size);
  color: var(--text-muted);
}

.retry-btn {
  margin-top: 6px;
}
</style>
