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
  font-size: 13.5px;
}

.th {
  padding: 10px 14px;
  text-align: right;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-family: var(--font-sans-en);
  border-bottom: 1px solid var(--border-default);
  white-space: nowrap;
  background: var(--hover-overlay);
}

.th--actions {
  text-align: center;
}

.tr {
  border-bottom: 1px solid var(--border-subtle);
  transition: background var(--motion-fast);
}

.tr:last-child {
  border-bottom: 0;
}

.tr:hover {
  background: var(--hover-overlay);
}

.td {
  padding: 12px 14px;
  color: var(--text-secondary);
  vertical-align: middle;
}

.td--name {
  font-weight: 500;
  color: var(--text-primary);
}

.td--slug {
  color: var(--text-muted);
  font-size: 12px;
  font-family: var(--font-mono);
}

.td--date {
  color: var(--text-muted);
  white-space: nowrap;
  font-size: 12px;
}

.td--actions {
  text-align: center;
  white-space: nowrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-default);
  background: var(--hover-overlay);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--motion-fast);
  margin-inline-start: 4px;
}

.action-btn--edit {
  color: var(--purple-400);
  border-color: rgba(109, 40, 217, 0.3);
  background: rgba(109, 40, 217, 0.08);
}

.action-btn--edit:hover {
  background: rgba(109, 40, 217, 0.18);
  border-color: rgba(109, 40, 217, 0.5);
  color: var(--purple-300);
}

.action-btn--delete {
  color: var(--danger-400);
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.06);
}

.action-btn--delete:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.5);
}
</style>
