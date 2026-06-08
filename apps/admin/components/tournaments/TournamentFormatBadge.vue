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
  padding: 3px 9px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.badge--single_elimination {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning-400);
}

.badge--round_robin {
  background: rgba(59, 130, 246, 0.15);
  color: var(--info-400);
}

.badge--manual {
  background: rgba(109, 40, 217, 0.15);
  color: var(--purple-300);
}
</style>
