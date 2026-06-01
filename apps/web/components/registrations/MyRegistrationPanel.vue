<template>
  <div class="my-registration-panel">
    <div class="panel-header">
      <h2>My Registration</h2>
      <RegistrationStatusBadge :status="registration.status" />
    </div>

    <dl class="registration-details">
      <dt>Type</dt>
      <dd>{{ registration.type === 'team' ? 'Team' : 'Individual' }}</dd>

      <template v-if="registration.type === 'team' && registration.teamName">
        <dt>Team</dt>
        <dd>{{ registration.teamName }}</dd>
      </template>

      <template v-if="registration.type === 'team' && registration.members?.length">
        <dt>Members</dt>
        <dd>
          <ul class="member-list">
            <li v-for="(member, idx) in registration.members" :key="member.userId ?? idx">
              {{ member.displayName }}
            </li>
          </ul>
        </dd>
      </template>

      <dt>Registered</dt>
      <dd>{{ new Date(registration.registeredAt).toLocaleDateString() }}</dd>
    </dl>

    <div class="panel-actions">
      <button v-if="canEdit" class="edit-btn" @click="$emit('edit')">Edit</button>
      <button v-if="canWithdraw" class="withdraw-btn" @click="$emit('withdraw')">
        Withdraw registration
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MyTournamentRegistrationDto } from '@dragon/types';

const props = defineProps<{
  registration: MyTournamentRegistrationDto;
}>();

defineEmits<{
  (e: 'withdraw'): void;
  (e: 'edit'): void;
}>();

const WITHDRAWABLE_STATUSES = ['submitted', 'approved', 'waitlisted'] as const;
type WithdrawableStatus = (typeof WITHDRAWABLE_STATUSES)[number];

const canWithdraw = computed(() =>
  WITHDRAWABLE_STATUSES.includes(props.registration.status as WithdrawableStatus),
);

const canEdit = computed(() => props.registration.type === 'team' && canWithdraw.value);
</script>

<style scoped>
.my-registration-panel {
  display: grid;
  gap: 1.25rem;
  padding: 1.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.125rem;
}

.registration-details {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.5rem 1.5rem;
  margin: 0;
}

.registration-details dt {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
}

.registration-details dd {
  margin: 0;
}

.member-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.panel-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.edit-btn {
  align-self: start;
  padding: 0.45rem 1rem;
  background: #fff;
  color: #2563eb;
  border: 1px solid #93c5fd;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
}

.edit-btn:hover {
  background: #eff6ff;
}

.withdraw-btn {
  align-self: start;
  padding: 0.45rem 1rem;
  background: #fff;
  color: #dc2626;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
}

.withdraw-btn:hover {
  background: #fee2e2;
}
</style>
