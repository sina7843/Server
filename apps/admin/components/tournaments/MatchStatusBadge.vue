<template>
  <span class="badge" :class="`badge--${status}`">{{ LABELS[status] ?? status }}</span>
</template>

<script setup lang="ts">
import type { TournamentMatchStatus } from '@dragon/types';

defineProps<{ status: TournamentMatchStatus }>();

const LABELS: Record<TournamentMatchStatus, string> = {
  scheduled: 'برنامه‌ریزی شده',
  in_progress: 'در حال برگزاری',
  completed: 'پایان یافته',
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

.badge--scheduled {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge--in_progress {
  background: #ede9fe;
  color: #5b21b6;
}

.badge--completed {
  background: #dcfce7;
  color: #166534;
}

.badge--cancelled {
  background: #fee2e2;
  color: #991b1b;
}
</style>
