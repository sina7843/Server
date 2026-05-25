<template>
  <form class="search-form" role="search" @submit.prevent>
    <input
      class="search-form__input"
      type="search"
      :value="query"
      placeholder="جستجو در محتوا..."
      maxlength="200"
      aria-label="جستجو"
      @input="onQueryInput"
    />
    <select class="search-form__type" :value="type" @change="onTypeChange">
      <option value="">همه محتوا</option>
      <option value="news">اخبار</option>
      <option value="article">مقالات</option>
      <option value="announcement">اعلانات</option>
      <option value="guide">راهنماها</option>
      <option value="rule">قوانین</option>
      <option value="page">صفحات</option>
    </select>
  </form>
</template>

<script setup lang="ts">
defineProps<{
  query: string;
  type: string;
}>();

const emit = defineEmits<{
  'update:query': [value: string];
  'update:type': [value: string];
  'query-change': [];
  'type-change': [];
}>();

function onQueryInput(e: Event) {
  emit('update:query', (e.target as HTMLInputElement).value);
  emit('query-change');
}

function onTypeChange(e: Event) {
  emit('update:type', (e.target as HTMLSelectElement).value);
  emit('type-change');
}
</script>

<style scoped>
.search-form {
  display: flex;
  gap: 0.75rem;
  margin-block-end: 1.5rem;
  flex-wrap: wrap;
}

.search-form__input {
  flex: 1;
  min-width: 200px;
  padding: 0.6rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s;
}

.search-form__input:focus {
  border-color: #3b82f6;
}

.search-form__type {
  padding: 0.6rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  background: #fff;
  outline: none;
  cursor: pointer;
  color: #374151;
}
</style>
