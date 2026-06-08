<template>
  <div class="trf">
    <div class="trf__field">
      <label for="team-name" class="trf__label">نام تیم</label>
      <input
        id="team-name"
        type="text"
        class="trf__input"
        :class="{ 'trf__input--error': errors.teamName }"
        :value="teamName"
        placeholder="نام تیم خود را وارد کنید"
        maxlength="80"
        :aria-invalid="!!errors.teamName || undefined"
        @input="$emit('update:teamName', ($event.target as HTMLInputElement).value)"
      />
      <p v-if="errors.teamName" class="trf__error" role="alert">{{ errors.teamName }}</p>
    </div>

    <div class="trf__field">
      <p class="trf__label">اعضای تیم</p>

      <ul v-if="localMembers.length > 0" class="trf__member-list">
        <li v-for="(member, index) in localMembers" :key="index" class="trf__member-row">
          <span class="trf__member-num">{{ index + 1 }}</span>
          <input
            type="text"
            class="trf__input"
            :value="member.displayName"
            :placeholder="`نام نمایشی عضو ${index + 1}`"
            :aria-label="`نام نمایشی عضو ${index + 1}`"
            @input="updateMemberDisplayName(index, ($event.target as HTMLInputElement).value)"
          />
          <button type="button" class="trf__remove-btn" :aria-label="`حذف عضو ${index + 1}`" @click="removeMember(index)">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </li>
      </ul>

      <button type="button" class="trf__add-btn" @click="addMember">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        افزودن عضو
      </button>

      <p v-if="errors.members" class="trf__error" role="alert">{{ errors.members }}</p>
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
  localMembers.value = [...localMembers.value, { displayName: '' }];
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
.trf {
  display: grid;
  gap: 1.25rem;
}

.trf__field {
  display: grid;
  gap: 8px;
}

.trf__label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  font-family: var(--font-sans-fa);
}

.trf__input {
  width: 100%;
  padding: 9px 12px;
  border-radius: 0.5rem;
  border: 1px solid var(--border-default);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-sans-fa);
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.trf__input:focus {
  outline: none;
  border-color: rgba(109, 40, 217, 0.5);
  background: rgba(109, 40, 217, 0.05);
}

.trf__input--error {
  border-color: rgba(239, 68, 68, 0.5);
}

.trf__member-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.trf__member-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trf__member-num {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(109, 40, 217, 0.1);
  border: 1px solid rgba(109, 40, 217, 0.2);
  color: var(--purple-300);
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-sans-en);
  display: flex;
  align-items: center;
  justify-content: center;
}

.trf__remove-btn {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 0.375rem;
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.07);
  color: var(--danger-400);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.trf__remove-btn:hover {
  background: rgba(239, 68, 68, 0.14);
}

.trf__add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 0.5rem;
  border: 1px dashed rgba(109, 40, 217, 0.35);
  background: rgba(109, 40, 217, 0.05);
  color: var(--purple-300);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-sans-fa);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  justify-self: start;
}

.trf__add-btn:hover {
  background: rgba(109, 40, 217, 0.1);
  border-color: rgba(109, 40, 217, 0.5);
}

.trf__error {
  margin: 0;
  font-size: 12px;
  color: var(--danger-400);
  font-family: var(--font-sans-fa);
}
</style>
