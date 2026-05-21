<template>
  <div class="state-wrapper">
    <p class="code">404</p>
    <p class="label">صفحه مورد نظر یافت نشد.</p>
    <a href="/dashboard" class="back">بازگشت به داشبورد</a>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
useHead({ meta: [{ name: 'robots', content: 'noindex' }], title: '404 — Not Found' });
</script>

<style scoped>
.state-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.code {
  margin: 0;
  font-size: 4rem;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1;
}

.label {
  margin: 0;
  font-size: 1rem;
  color: #374151;
}

.back {
  margin-block-start: 1rem;
  color: #3b82f6;
  font-size: 0.9rem;
  text-decoration: none;
}

.back:hover {
  text-decoration: underline;
}
</style>
