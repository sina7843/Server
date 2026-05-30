<template>
  <div class="state-container" role="alert">
    <div class="state-badge">403</div>
    <p class="state-label">{{ label }}</p>
    <p class="state-hint">{{ hint }}</p>
    <a href="/dashboard" class="dr-btn dr-btn-secondary dr-btn-sm">بازگشت به داشبورد</a>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    hint?: string;
  }>(),
  {
    label: 'دسترسی ممنوع',
    hint: 'شما مجوز دسترسی به این بخش را ندارید.',
  },
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
  text-align: center;
}

.state-badge {
  font-family: var(--font-display);
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
  background: var(--brand-gradient-text);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}

.state-label {
  margin: 0;
  font-size: var(--text-h4-size);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.state-hint {
  margin: 0;
  font-size: var(--text-body-sm-size);
  color: var(--text-muted);
}
</style>
