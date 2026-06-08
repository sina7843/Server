<template>
  <form class="edit-registration-form" @submit.prevent="handleSubmit">
    <TeamRegistrationFields
      v-model:team-name="teamName"
      v-model:members="teamMembers"
      :errors="errors"
    />

    <ValidationErrorState v-if="Object.keys(errors).length > 0" :errors="errors" />

    <div class="form-actions">
      <button type="submit" class="save-btn" :disabled="submitting">
        {{ submitting ? 'Saving…' : 'Save changes' }}
      </button>
      <button type="button" class="cancel-btn" :disabled="submitting" @click="$emit('cancel')">
        Cancel
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { MyTournamentRegistrationDto, TeamRegistrationMemberDto } from '@dragon/types';
import { validateRegistrationForm } from '../../features/registrations/registration.validation';

const props = defineProps<{
  registration: MyTournamentRegistrationDto;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', input: { teamName: string; members: readonly TeamRegistrationMemberDto[] }): void;
  (e: 'cancel'): void;
}>();

const teamName = ref(props.registration.teamName ?? '');
const teamMembers = ref<TeamRegistrationMemberDto[]>(
  props.registration.members ? [...props.registration.members] : [],
);
const errors = ref<Record<string, string>>({});

function handleSubmit() {
  const result = validateRegistrationForm({
    type: 'team',
    teamName: teamName.value,
    members: teamMembers.value,
  });
  errors.value = result.errors;
  if (!result.valid) return;

  emit('submit', { teamName: teamName.value, members: teamMembers.value });
}
</script>

<style scoped>
.edit-registration-form {
  display: grid;
  gap: 1.25rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.save-btn {
  padding: 0.55rem 1.5rem;
  background: var(--action-primary);
  color: var(--text-on-brand);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-btn:hover:not(:disabled) {
  background: var(--action-primary-hover);
}

.cancel-btn {
  padding: 0.55rem 1rem;
  background: var(--surface-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--glass-border-strong);
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn:hover:not(:disabled) {
  background: var(--surface-card);
}
</style>
