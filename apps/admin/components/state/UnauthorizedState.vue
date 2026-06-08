<template>
  <div class="state-container" role="alert">
    <div class="state-code-wrap" aria-hidden="true">
      <span class="state-code">401</span>
    </div>
    <div class="state-body">
      <p class="state-label">{{ label }}</p>
      <p class="state-hint">{{ hint }}</p>
      <a href="/login" class="login-link dr-btn dr-btn-primary dr-btn-sm">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        ورود به پنل ادمین
      </a>
    </div>
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
  gap: 20px;
  padding: 64px 24px;
  text-align: center;
}

.state-code-wrap {
  position: relative;
}

.state-code {
  font-family: var(--font-display);
  font-size: 72px;
  font-weight: 700;
  line-height: 1;
  background: var(--brand-gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block;
  filter: drop-shadow(0 8px 24px rgba(109, 40, 217, 0.45));
}

.state-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
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
  max-width: 280px;
  line-height: 1.6;
}

.login-link {
  margin-top: 8px;
  gap: 8px;
}
</style>
