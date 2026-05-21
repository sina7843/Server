<template>
  <nav class="sidebar" aria-label="ناوبری اصلی">
    <div class="sidebar-nav">
      <AdminNavItem v-for="item in visibleNavItems" :key="item.key" :item="item" />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAdminPermissions } from '~/composables/useAdminPermissions';

const { visibleNavItems } = useAdminPermissions();
</script>

<style scoped>
.sidebar {
  width: 220px;
  min-height: 100%;
  background: #1a1d23;
  padding: 1rem 0.5rem;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    min-height: unset;
    padding: 0.5rem;
  }

  .sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
