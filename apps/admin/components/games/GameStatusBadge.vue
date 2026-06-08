<template>
  <span class="badge" :class="`badge--${status}`">{{ LABELS[status] }}</span>
</template>

<script setup lang="ts">
import type { GameStatus } from '@dragon/types';

defineProps<{ status: GameStatus }>();

const LABELS: Record<GameStatus, string> = {
  active: 'فعال',
  inactive: 'غیرفعال',
  archived: 'بایگانی',
};
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.badge--active {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success-400);
}

.badge--inactive {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning-400);
}

.badge--archived {
  background: var(--hover-overlay);
  color: var(--text-muted);
}
</style>
