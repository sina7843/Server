<template>
  <div class="registration-type-selector">
    <label class="type-option">
      <input
        type="radio"
        name="registrationType"
        value="individual"
        :checked="modelValue === 'individual'"
        @change="$emit('update:modelValue', 'individual')"
      />
      Individual
    </label>
    <label class="type-option">
      <input
        type="radio"
        name="registrationType"
        value="team"
        :checked="modelValue === 'team'"
        @change="$emit('update:modelValue', 'team')"
      />
      Team
    </label>
  </div>
</template>

<script setup lang="ts">
import type { TournamentRegistrationType } from '../../features/registrations/registration.types';

defineProps<{
  modelValue: TournamentRegistrationType;
}>();

defineEmits<{
  (e: 'update:modelValue', value: TournamentRegistrationType): void;
}>();
</script>

<style scoped>
.registration-type-selector {
  display: flex;
  gap: 1.5rem;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-weight: 500;
}
</style>
