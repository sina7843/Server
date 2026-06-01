<template>
  <span class="badge" :class="`badge--${format}`">{{ LABELS[format] ?? format }}</span>
</template>

<script setup lang="ts">
import type { TournamentFormat } from '@dragon/types';

defineProps<{ format: TournamentFormat }>();

const LABELS: Record<TournamentFormat, string> = {
  single_elimination: 'حذفی ساده',
  round_robin: 'دوره‌ای',
  manual: 'دستی',
};
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.badge--single_elimination {
  background: #fef3c7;
  color: #92400e;
}

.badge--round_robin {
  background: #e0f2fe;
  color: #0c4a6e;
}

.badge--manual {
  background: #f3e8ff;
  color: #5b21b6;
}
</style>
