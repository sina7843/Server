<template>
  <div class="state-box" role="status">
    <div class="state-box__icon">
      <svg width="26" height="26" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
        <path fill-rule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/>
        <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
      </svg>
    </div>
    <h3 class="state-box__title">ظرفیت تکمیل شد</h3>
    <p class="state-box__desc">متأسفانه ظرفیت این تورنمنت تکمیل شده است.</p>
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
  border: 1px solid rgba(245, 158, 11, 0.25);
  background: rgba(245, 158, 11, 0.06);
}

.state-box__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: var(--warning-400);
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
