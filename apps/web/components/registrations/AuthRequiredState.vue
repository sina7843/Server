<template>
  <div class="auth-state" role="status">
    <div class="auth-state__icon">
      <svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
      </svg>
    </div>
    <div class="auth-state__content">
      <h3 class="auth-state__title">ورود الزامی است</h3>
      <p class="auth-state__desc">برای ثبت‌نام در تورنمنت باید وارد حساب کاربری خود شوید.</p>
    </div>
    <NuxtLink to="/login" class="auth-state__btn">
      ورود به حساب
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
      </svg>
    </NuxtLink>
  </div>
</template>

<style scoped>
.auth-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 2.5rem;
  text-align: center;
  border-radius: 0.875rem;
  border: 1px solid rgba(109, 40, 217, 0.25);
  background: rgba(109, 40, 217, 0.06);
}

.auth-state__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(109, 40, 217, 0.12);
  border: 1px solid rgba(109, 40, 217, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--purple-300);
}

.auth-state__content {
  display: grid;
  gap: 6px;
}

.auth-state__title {
  margin: 0;
  font-size: var(--text-body-size);
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-sans-fa);
}

.auth-state__desc {
  margin: 0;
  font-size: var(--text-body-sm-size);
  color: var(--text-secondary);
  font-family: var(--font-sans-fa);
  line-height: 1.6;
}

.auth-state__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 24px;
  border-radius: 0.5rem;
  background: var(--brand-gradient);
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-sans-fa);
  transition: opacity 0.15s, transform 0.15s;
}

.auth-state__btn:hover {
  opacity: 0.88;
  transform: scale(0.985);
}
</style>
