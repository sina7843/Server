<template>
  <div class="state-box" role="status">
    <div class="state-box__icon">
      <svg width="26" height="26" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </svg>
    </div>
    <div class="state-box__content">
      <h3 class="state-box__title">قبلاً ثبت‌نام کرده‌اید</h3>
      <p class="state-box__desc">شما در این تورنمنت ثبت‌نام کرده‌اید.</p>
      <RegistrationStatusBadge :status="registration.status" />
    </div>
    <NuxtLink to="my-registration" class="state-box__btn">
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
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 2.5rem;
  text-align: center;
  border-radius: 0.875rem;
  border: 1px solid rgba(16, 185, 129, 0.25);
  background: rgba(16, 185, 129, 0.06);
}

.state-box__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: var(--success-400);
}

.state-box__content {
  display: grid;
  gap: 8px;
  justify-items: center;
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
}

.state-box__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 0.5rem;
  background: var(--success-600);
  color: #fff;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-sans-fa);
  transition: background 0.15s;
}

.state-box__btn:hover {
  background: var(--success-500);
}
</style>
