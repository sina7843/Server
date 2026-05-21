<template>
  <tr class="perm-row">
    <td class="cell cell-key">{{ permission.key }}</td>
    <td class="cell">{{ permission.module }}</td>
    <td class="cell">{{ permission.resource }}</td>
    <td class="cell">{{ permission.action }}</td>
    <td class="cell cell-actions">
      <button
        v-if="canDetach && !isSystem"
        class="detach-btn"
        type="button"
        :disabled="detaching"
        @click="emit('detach', permission.id)"
      >
        حذف
      </button>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { PermissionResponse } from '@dragon/sdk';

const props = defineProps<{
  permission: PermissionResponse;
  canDetach: boolean;
  detaching?: boolean;
}>();

const emit = defineEmits<{ detach: [id: string] }>();

const isSystem = computed(() => props.permission.isSystem);
</script>

<style scoped>
.cell {
  padding: 0.6rem 1rem;
  border-block-end: 1px solid #f1f5f9;
  font-size: 0.845rem;
  color: #334155;
  vertical-align: middle;
}

.cell-key {
  font-family: monospace;
  font-size: 0.79rem;
  color: #3730a3;
}

.cell-actions {
  white-space: nowrap;
}

.detach-btn {
  font-size: 0.78rem;
  color: #ef4444;
  background: none;
  border: 1px solid #fca5a5;
  border-radius: 0.35rem;
  padding: 0.15rem 0.5rem;
  cursor: pointer;
  transition: background 0.15s;
}

.detach-btn:not(:disabled):hover {
  background: #fee2e2;
}

.detach-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
