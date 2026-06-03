<template>
  <span class="badge" :class="`badge--${status}`">{{ LABELS[status] ?? status }}</span>
</template>

<script setup lang="ts">
import type { RegistrationStatus } from '@dragon/types';

defineProps<{ status: RegistrationStatus }>();

const LABELS: Record<RegistrationStatus, string> = {
  submitted: 'در انتظار',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  waitlisted: 'لیست انتظار',
  withdrawn: 'انصراف داده',
  cancelled: 'لغو شده',
};
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge--submitted {
  background: #fef9c3;
  color: #854d0e;
}

.badge--approved {
  background: #dcfce7;
  color: #166534;
}

.badge--rejected {
  background: #fee2e2;
  color: #991b1b;
}

.badge--waitlisted {
  background: #ede9fe;
  color: #5b21b6;
}

.badge--withdrawn {
  background: #f1f5f9;
  color: #475569;
}

.badge--cancelled {
  background: #e5e7eb;
  color: #374151;
}
</style>
