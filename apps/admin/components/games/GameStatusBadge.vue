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

.badge--inactive {
  background: #fef9c3;
  color: #854d0e;
}

.badge--archived {
  background: #f1f5f9;
  color: #475569;
}
</style>
