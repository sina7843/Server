<template>
  <div class="search-results">
    <p class="search-results__count">{{ total }} نتیجه یافت شد</p>
    <SearchResultCard v-for="item in items" :key="item.id" :item="item" />
  </div>
</template>

<script setup lang="ts">
import type { SearchResultItemDto } from '@dragon/types';

defineProps<{
  items: readonly SearchResultItemDto[];
  total: number;
}>();
</script>

<style scoped>
.search-results__count {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-block-end: 0.5rem;
}
</style>
