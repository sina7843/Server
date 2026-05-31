<template>
  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th class="th">نام</th>
          <th class="th">اسلاگ</th>
          <th class="th">وضعیت</th>
          <th class="th">تاریخ ایجاد</th>
          <th class="th th--actions">عملیات</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="game in games" :key="game.id" class="tr">
          <td class="td td--name">{{ game.name }}</td>
          <td class="td td--slug">{{ game.slug }}</td>
          <td class="td">
            <GameStatusBadge :status="game.status" />
          </td>
          <td class="td td--date">{{ formatDate(game.createdAt) }}</td>
          <td class="td td--actions">
            <button
              v-if="canManage"
              class="action-btn action-btn--edit"
              type="button"
              @click="emit('edit', game.id)"
            >
              ویرایش
            </button>
            <button
              v-if="canManage"
              class="action-btn action-btn--delete"
              type="button"
              @click="emit('delete', game)"
            >
              حذف
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { GameDto } from '@dragon/types';

defineProps<{
  games: readonly GameDto[];
  canManage: boolean;
}>();

const emit = defineEmits<{
  edit: [id: string];
  delete: [game: GameDto];
}>();

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fa-IR');
}
</script>

<style scoped>
.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.th {
  padding: 0.6rem 0.85rem;
  text-align: right;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.th--actions {
  text-align: center;
}

.tr:hover {
  background: #f8fafc;
}

.td {
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
  vertical-align: middle;
}

.td--name {
  font-weight: 500;
}

.td--slug {
  color: #64748b;
  font-size: 0.8rem;
  font-family: monospace;
}

.td--date {
  color: #64748b;
  white-space: nowrap;
}

.td--actions {
  text-align: center;
  white-space: nowrap;
}

.action-btn {
  padding: 0.3rem 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s;
  background: #fff;
  margin-inline-start: 0.3rem;
}

.action-btn--edit {
  color: #3b82f6;
}

.action-btn--edit:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.action-btn--delete {
  color: #ef4444;
}

.action-btn--delete:hover {
  background: #fef2f2;
  border-color: #fecaca;
}
</style>
