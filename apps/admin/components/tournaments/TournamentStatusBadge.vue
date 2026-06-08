<template>
  <span class="badge" :class="`badge--${status}`">{{ LABELS[status] ?? status }}</span>
</template>

<script setup lang="ts">
import type { TournamentStatus } from '@dragon/types';

defineProps<{ status: TournamentStatus }>();

const LABELS: Record<TournamentStatus, string> = {
  draft: 'پیش‌نویس',
  published: 'منتشر شده',
  registration_open: 'ثبت‌نام باز',
  registration_closed: 'ثبت‌نام بسته',
  in_progress: 'در حال برگزاری',
  completed: 'پایان یافته',
  cancelled: 'لغو شده',
  archived: 'بایگانی',
};
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.badge--draft {
  background: var(--hover-overlay);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}

.badge--published {
  background: rgba(59, 130, 246, 0.15);
  color: var(--info-400);
}

.badge--registration_open {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success-400);
}

.badge--registration_closed {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning-400);
}

.badge--in_progress {
  background: rgba(109, 40, 217, 0.18);
  color: var(--purple-300);
}

.badge--completed {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success-400);
}

.badge--cancelled {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger-400);
}

.badge--archived {
  background: var(--hover-overlay);
  color: var(--text-muted);
}
</style>
