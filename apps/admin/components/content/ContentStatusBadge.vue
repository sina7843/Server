<template>
  <span class="badge" :class="`badge--${status}`">{{ LABELS[status] ?? status }}</span>
</template>

<script setup lang="ts">
const LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  published: 'منتشرشده',
  archived: 'بایگانی',
};

defineProps<{ status: string }>();
</script>

<style scoped>
.badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge--draft {
  background: #f1f5f9;
  color: #475569;
}

.badge--published {
  background: #dcfce7;
  color: #166534;
}

.badge--archived {
  background: #fef9c3;
  color: #854d0e;
}
</style>
