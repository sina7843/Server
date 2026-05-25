<template>
  <div>
    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" />
    <EmptyState v-else-if="!items.length" label="محتوایی برای نمایش وجود ندارد." />
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th class="th">عنوان / شناسه</th>
            <th class="th">نوع</th>
            <th class="th th--num">بازدید</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.resourceId" class="tr">
            <td class="td">{{ item.title ?? item.resourceId }}</td>
            <td class="td">{{ item.type ?? '—' }}</td>
            <td class="td td--num">{{ item.views }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AnalyticsContentTopItemDto } from '@dragon/types';

defineProps<{
  items: readonly AnalyticsContentTopItemDto[];
  loading?: boolean;
  error?: string | null;
}>();
</script>

<style scoped>
.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.th {
  padding: 0.65rem 1rem;
  text-align: start;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border-block-end: 1px solid #e2e8f0;
  white-space: nowrap;
}

.th--num {
  text-align: end;
}

.tr:not(:last-child) {
  border-block-end: 1px solid #f1f5f9;
}

.td {
  padding: 0.7rem 1rem;
  font-size: 0.875rem;
  color: #334155;
  vertical-align: middle;
}

.td--num {
  text-align: end;
  font-variant-numeric: tabular-nums;
  color: #1e293b;
  font-weight: 600;
}
</style>
