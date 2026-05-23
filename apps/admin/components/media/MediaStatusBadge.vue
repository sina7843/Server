<template>
  <span class="badge" :class="`badge--${status}`">{{ LABELS[status] ?? status }}</span>
</template>

<script setup lang="ts">
defineProps<{ status: string }>();

const LABELS: Record<string, string> = {
  uploaded: 'آپلود شده',
  processing: 'در حال پردازش',
  ready: 'آماده',
  failed: 'خطا',
};
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.badge--uploaded {
  background: #e0f2fe;
  color: #0369a1;
}

.badge--processing {
  background: #fef9c3;
  color: #854d0e;
}

.badge--ready {
  background: #dcfce7;
  color: #166534;
}

.badge--failed {
  background: #fee2e2;
  color: #991b1b;
}
</style>
