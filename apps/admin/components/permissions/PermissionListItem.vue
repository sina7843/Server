<template>
  <tr class="perm-row">
    <td class="cell cell-key">{{ permission.key }}</td>
    <td class="cell">{{ permission.module }}</td>
    <td class="cell">{{ permission.resource }}</td>
    <td class="cell">{{ permission.action }}</td>
    <td class="cell">
      <span v-if="permission.description" class="desc">{{ permission.description }}</span>
      <span v-else class="no-desc">—</span>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { PermissionResponse } from '@dragon/sdk';

defineProps<{ permission: PermissionResponse }>();
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

.desc {
  font-size: 0.8rem;
  color: #64748b;
}

.no-desc {
  color: #94a3b8;
}
</style>
