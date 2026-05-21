<template>
  <div class="state-container" role="alert">
    <p class="state-code">401</p>
    <p class="state-label">{{ label }}</p>
    <p class="state-hint">{{ hint }}</p>
    <a href="/login" class="login-link">ورود به پنل ادمین</a>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    hint?: string;
  }>(),
  {
    label: 'احراز هویت لازم است',
    hint: 'برای دسترسی به این بخش وارد شوید.',
  },
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
  text-align: center;
}

.state-code {
  margin: 0;
  font-size: 3.5rem;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1;
}

.state-label {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
}

.state-hint {
  margin: 0;
  font-size: 0.9rem;
  color: #94a3b8;
}

.login-link {
  margin-block-start: 1rem;
  color: #3b82f6;
  font-size: 0.9rem;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}
</style>
