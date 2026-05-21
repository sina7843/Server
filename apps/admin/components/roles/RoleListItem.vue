<template>
  <tr class="role-row" :class="{ 'role-row--inactive': !role.isActive }">
    <td class="cell cell-key">
      <NuxtLink :to="`/roles/${role.id}`" class="key-link">{{ role.key }}</NuxtLink>
    </td>
    <td class="cell">
      <span class="role-name">{{ role.name }}</span>
      <span v-if="role.description" class="role-desc">{{ role.description }}</span>
    </td>
    <td class="cell cell-flags">
      <SystemRoleBadge v-if="role.isSystem" />
      <span v-if="!role.isActive" class="badge-inactive">غیرفعال</span>
      <span v-if="!role.isAssignable && !role.isSystem" class="badge-unassignable">
        غیرقابل‌تخصیص
      </span>
    </td>
    <td class="cell cell-actions">
      <NuxtLink v-if="canEdit && !role.isSystem" :to="`/roles/${role.id}/edit`" class="action-link">
        ویرایش
      </NuxtLink>
      <button
        v-if="canDeactivate && !role.isSystem && role.isActive"
        class="action-btn-danger"
        type="button"
        @click="emit('deactivate', role.id)"
      >
        غیرفعال
      </button>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { RoleResponse } from '@dragon/sdk';

defineProps<{
  role: RoleResponse;
  canEdit: boolean;
  canDeactivate: boolean;
}>();

const emit = defineEmits<{ deactivate: [id: string] }>();
</script>

<style scoped>
.role-row--inactive {
  opacity: 0.6;
}

.cell {
  padding: 0.75rem 1rem;
  border-block-end: 1px solid #f1f5f9;
  font-size: 0.875rem;
  color: #334155;
  vertical-align: middle;
}

.cell-key {
  font-family: monospace;
  font-size: 0.82rem;
}

.key-link {
  color: #3730a3;
  text-decoration: none;
  font-weight: 600;
}

.key-link:hover {
  text-decoration: underline;
}

.role-name {
  display: block;
  font-weight: 600;
  color: #1e293b;
}

.role-desc {
  display: block;
  font-size: 0.78rem;
  color: #64748b;
  margin-block-start: 0.1rem;
}

.cell-flags {
  white-space: nowrap;
}

.badge-inactive {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #475569;
  margin-inline-start: 0.35rem;
}

.badge-unassignable {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: #fef3c7;
  color: #92400e;
  margin-inline-start: 0.35rem;
}

.cell-actions {
  white-space: nowrap;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.action-link {
  font-size: 0.82rem;
  color: #3b82f6;
  text-decoration: none;
}

.action-link:hover {
  text-decoration: underline;
}

.action-btn-danger {
  font-size: 0.8rem;
  color: #ef4444;
  background: none;
  border: 1px solid #fca5a5;
  border-radius: 0.35rem;
  padding: 0.15rem 0.5rem;
  cursor: pointer;
  transition: background 0.15s;
}

.action-btn-danger:hover {
  background: #fee2e2;
}
</style>
