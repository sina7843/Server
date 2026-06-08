<template>
  <ul class="content-list" aria-label="فهرست محتوا">
    <li v-for="item in items" :key="item.id" class="content-list__item">
      <ContentCard :item="item" :base-path="basePath" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { PublicPostDto } from '@dragon/sdk';

defineProps<{
  items: readonly PublicPostDto[];
  basePath: string;
}>();
</script>

<style scoped>
.content-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr;
}

.content-list__item {
  display: block;
}

@media (min-width: 640px) {
  .content-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .content-list {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
