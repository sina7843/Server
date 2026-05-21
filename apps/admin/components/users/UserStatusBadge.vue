<template>
  <span class="badge" :class="`badge--${status}`">{{ label }}</span>
</template>

<script setup lang="ts">
import type { AdminUserStatus } from '@dragon/sdk';

const props = defineProps<{ status: AdminUserStatus }>();

const LABELS: Record<AdminUserStatus, string> = {
  pending_verification: 'در انتظار تأیید',
  active: 'فعال',
  suspended: 'تعلیق',
  banned: 'مسدود',
  deleted: 'حذف‌شده',
};

const label = computed(() => LABELS[props.status]);
</script>

<style scoped>
.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge--active {
  background: #dcfce7;
  color: #166534;
}

.badge--pending_verification {
  background: #fef9c3;
  color: #854d0e;
}

.badge--suspended {
  background: #fef3c7;
  color: #92400e;
}

.badge--banned {
  background: #fee2e2;
  color: #991b1b;
}

.badge--deleted {
  background: #f1f5f9;
  color: #475569;
}
</style>
