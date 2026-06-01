<template>
  <div class="team-registration-fields">
    <div class="field">
      <label for="team-name">Team name</label>
      <input
        id="team-name"
        type="text"
        :value="teamName"
        maxlength="80"
        :aria-invalid="!!errors.teamName || undefined"
        @input="$emit('update:teamName', ($event.target as HTMLInputElement).value)"
      />
      <p v-if="errors.teamName" class="field-error" role="alert">{{ errors.teamName }}</p>
    </div>

    <div class="field">
      <p class="field-label">Team members</p>
      <ul v-if="localMembers.length > 0" class="member-list">
        <li v-for="(member, index) in localMembers" :key="index" class="member-row">
          <input
            type="text"
            :value="member.displayName"
            placeholder="Display name"
            :aria-label="`Member ${index + 1} display name`"
            @input="updateMemberDisplayName(index, ($event.target as HTMLInputElement).value)"
          />
          <button type="button" class="remove-member-btn" @click="removeMember(index)">
            Remove
          </button>
        </li>
      </ul>
      <button type="button" class="add-member-btn" @click="addMember">Add member</button>
      <p v-if="errors.members" class="field-error" role="alert">{{ errors.members }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TeamRegistrationMemberDto } from '../../features/registrations/registration.types';

const props = defineProps<{
  teamName: string;
  members?: readonly TeamRegistrationMemberDto[];
  errors: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: 'update:teamName', value: string): void;
  (e: 'update:members', value: readonly TeamRegistrationMemberDto[]): void;
}>();

const localMembers = ref<TeamRegistrationMemberDto[]>(props.members ? [...props.members] : []);

function addMember() {
  localMembers.value = [...localMembers.value, { userId: '', displayName: '' }];
  emit('update:members', localMembers.value);
}

function removeMember(index: number) {
  localMembers.value = localMembers.value.filter((_, i) => i !== index);
  emit('update:members', localMembers.value);
}

function updateMemberDisplayName(index: number, displayName: string) {
  localMembers.value = localMembers.value.map((m, i) => (i === index ? { ...m, displayName } : m));
  emit('update:members', localMembers.value);
}
</script>

<style scoped>
.team-registration-fields {
  display: grid;
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.375rem;
}

.field-label {
  font-weight: 500;
  margin: 0;
}

.member-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
}

.member-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.member-row input {
  flex: 1;
}

.add-member-btn,
.remove-member-btn {
  padding: 0.35rem 0.75rem;
  border-radius: 0.25rem;
  border: 1px solid currentColor;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
}

.field-error {
  color: #dc2626;
  font-size: 0.8rem;
  margin: 0;
}
</style>
