<template>
  <div class="state-box" role="status">
    <div class="state-box__icon state-box__icon--neutral">
      <svg width="26" height="26" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM11 9.5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1 0-1h5a.5.5 0 0 1 .5.5zm-5-4a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5z"/>
        <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
      </svg>
    </div>
    <h3 class="state-box__title">ثبت‌نام بسته است</h3>
    <p class="state-box__desc">ثبت‌نام این تورنمنت در حال حاضر بسته شده است.</p>
  </div>
</template>

<style scoped>
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 2.5rem;
  text-align: center;
  border-radius: 0.875rem;
  border: 1px solid var(--glass-border-strong);
  background: var(--surface-elevated);
}

.state-box__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.state-box__icon--neutral {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border-strong);
  color: var(--text-muted);
}

.state-box__title {
  margin: 0;
  font-size: var(--text-body-size);
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-sans-fa);
}

.state-box__desc {
  margin: 0;
  font-size: var(--text-body-sm-size);
  color: var(--text-secondary);
  font-family: var(--font-sans-fa);
  line-height: 1.6;
}
</style>
