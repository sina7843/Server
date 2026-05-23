<template>
  <div class="state-msg" :class="`state-msg--${state}`" role="status">
    <p v-if="state === 'loading'">در حال بارگذاری...</p>
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
  padding: 2rem 1rem;
  text-align: center;
  color: #64748b;
}

.state-msg--error {
  color: #dc2626;
}

.state-msg--not-found {
  color: #94a3b8;
}
</style>
