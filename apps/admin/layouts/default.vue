<template>
  <div class="auth-shell">
    <div class="auth-glow" />
    <div class="auth-card">
      <div class="auth-brand">
        <div class="brand-mark">D</div>
        <div>
          <div class="brand-name">DRAGON</div>
          <div class="brand-sub">Admin Console</div>
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.auth-glow {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(ellipse at center, rgba(124, 58, 237, 0.3), transparent 65%);
  filter: blur(40px);
  pointer-events: none;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  margin: 24px;
  background: var(--surface-card);
  border: 1px solid var(--glass-border-strong);
  border-radius: var(--radius-xl);
  padding: 40px;
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  box-shadow:
    var(--shadow-xl),
    inset 0 1px 0 var(--glass-inset-highlight);
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 36px;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--brand-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 20px;
  color: #fff;
  box-shadow: var(--glow-primary);
  flex-shrink: 0;
}

.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.brand-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}
</style>
