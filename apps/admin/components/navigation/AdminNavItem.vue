<template>
  <NuxtLink :to="item.path" class="nav-item" active-class="nav-item--active">
    <span class="nav-label">{{ item.label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { AdminNavItem } from '~/features/navigation/admin-navigation';

defineProps<{
  item: AdminNavItem;
}>();
</script>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  color: #94a3b8;
  font-size: 0.9rem;
  transition:
    background 0.15s,
    color 0.15s;
  gap: 0.5rem;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
}

.nav-item--active {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.nav-label {
  flex: 1;
}
</style>
