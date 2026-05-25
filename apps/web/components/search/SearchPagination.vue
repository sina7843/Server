<template>
  <div class="search-pagination">
    <button
      class="search-pagination__btn"
      type="button"
      :disabled="page <= 1"
      @click="emit('page-change', page - 1)"
    >
      قبلی
    </button>
    <span class="search-pagination__info">صفحه {{ page }}</span>
    <button
      class="search-pagination__btn"
      type="button"
      :disabled="!hasNextPage"
      @click="emit('page-change', page + 1)"
    >
      بعدی
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  page: number;
  total: number;
  limit: number;
}>();

const emit = defineEmits<{
  'page-change': [page: number];
}>();

const hasNextPage = computed(() => props.page * props.limit < props.total);
</script>

<style scoped>
.search-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-block-start: 2rem;
}

.search-pagination__btn {
  padding: 0.45rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  font-size: 0.875rem;
  background: #fff;
  cursor: pointer;
  color: #334155;
  transition: background 0.15s;
}

.search-pagination__btn:not(:disabled):hover {
  background: #f1f5f9;
}

.search-pagination__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.search-pagination__info {
  font-size: 0.875rem;
  color: #64748b;
}
</style>
