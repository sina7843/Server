<template>
  <tr class="user-row">
    <td class="cell cell-name">
      <NuxtLink :to="`/users/${user.id}`" class="user-link">
        {{ user.profile?.displayName ?? user.profile?.username ?? '—' }}
      </NuxtLink>
      <span v-if="user.profile?.username" class="username">@{{ user.profile.username }}</span>
    </td>
    <td class="cell">
      <UserStatusBadge :status="user.status" />
    </td>
    <td class="cell cell-phone">{{ user.phoneMasked ?? '—' }}</td>
    <td class="cell cell-date">{{ formatDate(user.createdAt) }}</td>
    <td class="cell cell-actions">
      <NuxtLink :to="`/users/${user.id}`" class="action-link">مشاهده</NuxtLink>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { AdminUserListItem } from '@dragon/sdk';

defineProps<{ user: AdminUserListItem }>();

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
</script>

<style scoped>
.user-row:hover {
  background: #f8fafc;
}

.cell {
  padding: 0.75rem 1rem;
  border-block-end: 1px solid #f1f5f9;
  font-size: 0.875rem;
  color: #334155;
  vertical-align: middle;
}

.cell-name {
  min-width: 180px;
}

.user-link {
  color: #1e293b;
  font-weight: 600;
  text-decoration: none;
}

.user-link:hover {
  color: #3b82f6;
}

.username {
  display: block;
  font-size: 0.78rem;
  color: #64748b;
  margin-block-start: 0.1rem;
}

.cell-phone {
  font-variant-numeric: tabular-nums;
  direction: ltr;
  text-align: start;
}

.cell-date {
  white-space: nowrap;
  color: #64748b;
}

.cell-actions {
  white-space: nowrap;
}

.action-link {
  font-size: 0.82rem;
  color: #3b82f6;
  text-decoration: none;
}

.action-link:hover {
  text-decoration: underline;
}
</style>
