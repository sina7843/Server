<template>
  <span class="badge" :class="`badge--${status}`">{{ LABELS[status] ?? status }}</span>
</template>

<script setup lang="ts">
import type { ParticipantStatus } from '@dragon/types';

defineProps<{ status: ParticipantStatus }>();

const LABELS: Record<ParticipantStatus, string> = {
  active: 'فعال',
  withdrawn: 'انصراف داده',
  disqualified: 'محروم شده',
  removed: 'حذف شده',
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

.badge--active {
  background: #dcfce7;
  color: #166534;
}

.badge--withdrawn {
  background: #f1f5f9;
  color: #475569;
}

.badge--disqualified {
  background: #fee2e2;
  color: #991b1b;
}

.badge--removed {
  background: #e5e7eb;
  color: #374151;
}
</style>
