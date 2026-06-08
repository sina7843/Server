<template>
  <form class="reg-form" @submit.prevent="handleSubmit">
    <div class="reg-form__card">
      <div class="reg-form__field">
        <p class="reg-form__label">نوع ثبت‌نام</p>
        <RegistrationTypeSelector v-model="formType" />
      </div>

      <TeamRegistrationFields
        v-if="formType === 'team'"
        v-model:team-name="teamName"
        v-model:members="teamMembers"
        :errors="errors"
      />
    </div>

    <ValidationErrorState v-if="Object.keys(errors).length > 0" :errors="errors" />

    <button type="submit" class="reg-form__submit" :disabled="submitting">
      <span v-if="submitting" class="reg-form__spinner" aria-hidden="true" />
      <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
      </svg>
      {{ submitting ? 'در حال ثبت‌نام...' : 'ثبت‌نام' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import type { TournamentRegistrationInputDto, TeamRegistrationMemberDto } from '@dragon/types';
import { validateRegistrationForm } from '../../features/registrations/registration.validation';

defineProps<{ submitting?: boolean }>();

const emit = defineEmits<{
  (e: 'submit', input: TournamentRegistrationInputDto): void;
}>();

const formType = ref<'individual' | 'team'>('individual');
const teamName = ref('');
const teamMembers = ref<TeamRegistrationMemberDto[]>([]);
const errors = ref<Record<string, string>>({});

function handleSubmit() {
  const data = {
    type: formType.value,
    teamName: formType.value === 'team' ? teamName.value : undefined,
    members: formType.value === 'team' ? teamMembers.value : undefined,
  };

  const result = validateRegistrationForm(data);
  errors.value = result.errors;
  if (!result.valid) return;

  const input: TournamentRegistrationInputDto =
    formType.value === 'team'
      ? { type: 'team', teamName: teamName.value, members: teamMembers.value }
      : { type: 'individual' };

  emit('submit', input);
}
</script>

<style scoped>
.reg-form {
  display: grid;
  gap: 1.25rem;
}

.reg-form__card {
  display: grid;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: 0.875rem;
  border: 1px solid var(--glass-border-strong);
  background: var(--surface-card);
  backdrop-filter: blur(12px);
}

.reg-form__field {
  display: grid;
  gap: 8px;
}

.reg-form__label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  font-family: var(--font-sans-fa);
  letter-spacing: 0.01em;
}

.reg-form__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 24px;
  border-radius: 0.625rem;
  border: none;
  background: var(--brand-gradient);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font-sans-fa);
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
}

.reg-form__submit:hover:not(:disabled) {
  opacity: 0.88;
  transform: scale(0.99);
}

.reg-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reg-form__spinner {
  display: block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
