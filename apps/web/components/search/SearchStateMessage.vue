<template>
  <div class="search-state" :class="`search-state--${state}`" role="status">
    <p v-if="state === 'loading'">در حال جستجو...</p>
    <p v-else-if="state === 'error'">خطا در جستجو. لطفاً دوباره تلاش کنید.</p>
    <p v-else-if="state === 'no-results'">
      نتیجه‌ای برای
      <strong v-if="query">«{{ query }}»</strong>
      یافت نشد.
    </p>
    <p v-else-if="state === 'empty'">محتوایی برای نمایش وجود ندارد.</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  state: 'loading' | 'error' | 'no-results' | 'empty';
  query?: string;
}>();
</script>

<style scoped>
.search-state {
  padding: 3rem 1rem;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
}

.search-state--error {
  color: #dc2626;
}

.search-state--no-results strong {
  color: #1e293b;
}
</style>
