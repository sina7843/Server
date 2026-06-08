<template>
  <div class="rts" role="radiogroup" aria-label="نوع ثبت‌نام">
    <label class="rts__option" :class="{ 'rts__option--active': modelValue === 'individual' }">
      <input
        type="radio"
        name="registrationType"
        value="individual"
        class="rts__radio"
        :checked="modelValue === 'individual'"
        @change="$emit('update:modelValue', 'individual')"
      />
      <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
      </svg>
      <div>
        <span class="rts__label">انفرادی</span>
        <span class="rts__hint">ثبت‌نام به تنهایی</span>
      </div>
    </label>

    <label class="rts__option" :class="{ 'rts__option--active': modelValue === 'team' }">
      <input
        type="radio"
        name="registrationType"
        value="team"
        class="rts__radio"
        :checked="modelValue === 'team'"
        @change="$emit('update:modelValue', 'team')"
      />
      <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
        <path fill-rule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/>
        <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
      </svg>
      <div>
        <span class="rts__label">تیمی</span>
        <span class="rts__hint">ثبت‌نام با تیم</span>
      </div>
    </label>
  </div>
</template>

<script setup lang="ts">
import type { TournamentRegistrationType } from '../../features/registrations/registration.types';

defineProps<{ modelValue: TournamentRegistrationType }>();
defineEmits<{ (e: 'update:modelValue', value: TournamentRegistrationType): void }>();
</script>

<style scoped>
.rts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.rts__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 0.625rem;
  border: 1px solid var(--glass-border-strong);
  background: var(--surface-elevated);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  color: var(--text-secondary);
}

.rts__option:hover {
  border-color: rgba(109, 40, 217, 0.35);
  background: rgba(109, 40, 217, 0.06);
}

.rts__option--active {
  border-color: rgba(109, 40, 217, 0.5);
  background: rgba(109, 40, 217, 0.1);
  color: var(--purple-300);
}

.rts__radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.rts__label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-sans-fa);
  color: var(--text-primary);
  line-height: 1;
}

.rts__hint {
  display: block;
  font-size: 11px;
  font-family: var(--font-sans-fa);
  color: var(--text-muted);
  margin-top: 2px;
}
</style>
