<template>
  <span :class="`registration-status-badge registration-status-badge--${status}`">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import type { TournamentRegistrationStatus } from '@dragon/types';

const props = defineProps<{
  status: TournamentRegistrationStatus;
}>();

const STATUS_LABELS: Record<TournamentRegistrationStatus, string> = {
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
  withdrawn: 'Withdrawn',
  cancelled: 'Cancelled',
};

const label = computed(() => STATUS_LABELS[props.status] ?? props.status);
</script>

<style scoped>
.registration-status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.registration-status-badge--submitted {
  background: #dbeafe;
  color: #1e40af;
}

.registration-status-badge--approved {
  background: #dcfce7;
  color: #166534;
}

.registration-status-badge--rejected {
  background: #fee2e2;
  color: #991b1b;
}

.registration-status-badge--waitlisted {
  background: #fef9c3;
  color: #854d0e;
}

.registration-status-badge--withdrawn,
.registration-status-badge--cancelled {
  background: #f3f4f6;
  color: #6b7280;
}
</style>
