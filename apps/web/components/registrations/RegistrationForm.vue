<template>
  <form class="registration-form" @submit.prevent="handleSubmit">
    <div class="field">
      <p class="field-label">Registration type</p>
      <RegistrationTypeSelector v-model="formType" />
    </div>

    <TeamRegistrationFields
      v-if="formType === 'team'"
      v-model:team-name="teamName"
      v-model:members="teamMembers"
      :errors="errors"
    />

    <ValidationErrorState v-if="Object.keys(errors).length > 0" :errors="errors" />

    <button type="submit" class="submit-btn" :disabled="submitting">
      {{ submitting ? 'Submitting…' : 'Register' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import type { TournamentRegistrationInputDto, TeamRegistrationMemberDto } from '@dragon/types';
import { validateRegistrationForm } from '../../features/registrations/registration.validation';

defineProps<{
  submitting?: boolean;
}>();

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
.registration-form {
  display: grid;
  gap: 1.25rem;
}

.field {
  display: grid;
  gap: 0.375rem;
}

.field-label {
  font-weight: 500;
  margin: 0;
}

.submit-btn {
  align-self: start;
  padding: 0.55rem 1.5rem;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
}
</style>
