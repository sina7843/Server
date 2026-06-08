<template>
  <div class="state-container">
    <div class="state-icon-wrap" aria-hidden="true">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </svg>
    </div>
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
  gap: 10px;
  padding: 56px 24px;
  color: var(--text-muted);
  text-align: center;
}

.state-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-disabled);
  margin-bottom: 6px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12);
}

.state-label {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.state-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  max-width: 320px;
  line-height: 1.6;
}
</style>
