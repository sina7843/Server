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
  submitted: 'ثبت شده',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  waitlisted: 'در صف انتظار',
  withdrawn: 'انصراف داده',
  cancelled: 'لغو شده',
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
  background: rgba(109, 40, 217, 0.15);
  color: var(--purple-300);
}

.registration-status-badge--approved {
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-400);
}

.registration-status-badge--rejected {
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger-400);
}

.registration-status-badge--waitlisted {
  background: rgba(245, 158, 11, 0.12);
  color: var(--warning-400);
}

.registration-status-badge--withdrawn,
.registration-status-badge--cancelled {
  background: var(--surface-elevated);
  color: var(--text-muted);
}
</style>
