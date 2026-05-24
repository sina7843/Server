<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">سیستم</h1>
    </div>

    <nav class="nav-list">
      <NuxtLink
        v-if="hasPermission(Permissions.SYSTEM_HEALTH_READ)"
        to="/system/health"
        class="nav-item"
      >
        <span class="nav-item-label">سلامت سیستم</span>
        <span class="nav-item-arrow">←</span>
      </NuxtLink>
      <NuxtLink
        v-if="hasPermission(Permissions.SYSTEM_JOB_READ)"
        to="/system/jobs"
        class="nav-item"
      >
        <span class="nav-item-label">جاب‌ها</span>
        <span class="nav-item-arrow">←</span>
      </NuxtLink>
      <NuxtLink
        v-if="hasPermission(Permissions.NOTIFICATION_LOG_READ)"
        to="/system/notifications"
        class="nav-item"
      >
        <span class="nav-item-label">اعلان‌ها</span>
        <span class="nav-item-arrow">←</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.SYSTEM_HEALTH_READ,
});
useHead({ title: 'سیستم — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
</script>

<style scoped>
.page {
  max-width: 600px;
}

.page-header {
  margin-block-end: 1.5rem;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #fff;
  text-decoration: none;
  color: #1e293b;
  font-size: 0.95rem;
  font-weight: 500;
  transition: background 0.15s;
}

.nav-item:hover {
  background: #f8fafc;
}

.nav-item-arrow {
  font-size: 0.85rem;
  color: #94a3b8;
}
</style>
