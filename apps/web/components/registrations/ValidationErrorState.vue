<template>
  <div class="val-err" role="alert">
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
      <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
    </svg>
    <div>
      <p class="val-err__title">لطفاً خطاهای زیر را برطرف کنید:</p>
      <ul class="val-err__list">
        <li v-for="[field, message] in Object.entries(errors)" :key="field">{{ message }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ errors: Record<string, string> }>();
</script>

<style scoped>
.val-err {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 0.5rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--danger-400);
  font-family: var(--font-sans-fa);
}

.val-err svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.val-err__title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
}

.val-err__list {
  margin: 0;
  padding-right: 1.25rem;
}

.val-err__list li {
  font-size: 13px;
  line-height: 1.6;
}
</style>
