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
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge--draft {
  background: #f1f5f9;
  color: #475569;
}

.badge--published {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge--registration_open {
  background: #dcfce7;
  color: #166534;
}

.badge--registration_closed {
  background: #fef9c3;
  color: #854d0e;
}

.badge--in_progress {
  background: #ede9fe;
  color: #5b21b6;
}

.badge--completed {
  background: #d1fae5;
  color: #065f46;
}

.badge--cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.badge--archived {
  background: #e5e7eb;
  color: #374151;
}
</style>
