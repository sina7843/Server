<template>
  <div class="state-msg" :class="`state-msg--${state}`" role="status">
    <div v-if="state === 'loading'" class="state-spinner" />
    <p v-if="state === 'loading'">در حال بارگذاری…</p>
    <p v-else-if="state === 'error'">خطا در بارگذاری محتوا. لطفاً دوباره تلاش کنید.</p>
    <p v-else-if="state === 'empty'">محتوایی برای نمایش وجود ندارد.</p>
    <p v-else-if="state === 'not-found'">صفحه مورد نظر یافت نشد.</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  state: 'loading' | 'error' | 'empty' | 'not-found';
}>();
</script>

<style scoped>
.state-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: var(--text-body-sm-size);
}

.state-msg--error {
  color: var(--danger-400);
}

.state-spinner {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--glass-border-strong);
  border-top-color: var(--purple-400);
  animation: dr-spin 0.8s linear infinite;
}
</style>
