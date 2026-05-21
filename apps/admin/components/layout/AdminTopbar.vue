<template>
  <header class="topbar">
    <div class="topbar-start">
      <span class="brand">Dragon Admin</span>
    </div>
    <div class="topbar-end">
      <span v-if="displayName" class="user-id" :title="displayName">{{ displayName }}</span>
      <button class="logout-btn" type="button" @click="handleLogout">خروج</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAdminAuth } from '~/composables/useAdminAuth';

const router = useRouter();
const { displayName, logout } = useAdminAuth();

function handleLogout() {
  logout();
  router.push('/login');
}
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding-inline: 1.25rem;
  background: #ffffff;
  border-block-end: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.brand {
  font-weight: 700;
  font-size: 1rem;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.topbar-end {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-id {
  font-size: 0.8rem;
  color: #64748b;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  padding: 0.3rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 0.82rem;
  color: #475569;
  transition: background 0.15s;
}

.logout-btn:hover {
  background: #f1f5f9;
}
</style>
