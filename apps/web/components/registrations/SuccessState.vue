<template>
  <div class="success-state" role="status">
    <div class="success-state__icon">
      <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </svg>
    </div>
    <div class="success-state__content">
      <h3 class="success-state__title">ثبت‌نام موفق!</h3>
      <p class="success-state__desc">ثبت‌نام شما با موفقیت انجام شد.</p>
      <RegistrationStatusBadge :status="registration.status" />
    </div>
    <NuxtLink to="my-registration" class="success-state__btn">
      مشاهده ثبت‌نام من
      <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
      </svg>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { MyTournamentRegistrationDto } from '@dragon/types';
defineProps<{ registration: MyTournamentRegistrationDto }>();
</script>

<style scoped>
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 3rem 2.5rem;
  text-align: center;
  border-radius: 0.875rem;
  border: 1px solid rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.07);
}

.success-state__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--success-400);
  animation: pop-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop-in {
  from { transform: scale(0.6); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

.success-state__content {
  display: grid;
  gap: 8px;
  justify-items: center;
}

.success-state__title {
  margin: 0;
  font-size: var(--text-h4-size);
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-sans-fa);
}

.success-state__desc {
  margin: 0;
  font-size: var(--text-body-sm-size);
  color: var(--text-secondary);
  font-family: var(--font-sans-fa);
}

.success-state__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 24px;
  border-radius: 0.5rem;
  background: var(--success-600);
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-sans-fa);
  transition: background 0.15s;
}

.success-state__btn:hover {
  background: var(--success-500);
}
</style>
