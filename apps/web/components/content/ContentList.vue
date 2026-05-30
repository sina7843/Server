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
  gap: 16px;
}

.content-list__item {
  display: block;
}
</style>
