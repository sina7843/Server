<template>
  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th class="th">عنوان</th>
          <th class="th">فرمت</th>
          <th class="th">وضعیت</th>
          <th class="th th--actions">عملیات</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tournament in tournaments" :key="tournament.id" class="tr">
          <td class="td td--title">
            <NuxtLink :to="`/tournaments/${tournament.id}`" class="title-link">
              {{ tournament.title }}
            </NuxtLink>
            <span class="td--slug">{{ tournament.slug }}</span>
          </td>
          <td class="td">
            <TournamentFormatBadge :format="tournament.format" />
          </td>
          <td class="td">
            <TournamentStatusBadge :status="tournament.status" />
          </td>
          <td class="td td--actions">
            <NuxtLink
              v-if="canUpdate"
              :to="`/tournaments/${tournament.id}/edit`"
              class="action-btn action-btn--edit"
            >
              ویرایش
            </NuxtLink>
            <button
              v-if="canDelete"
              class="action-btn action-btn--delete"
              type="button"
              @click="emit('delete', tournament)"
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
import type { AdminTournamentDto } from '@dragon/types';

defineProps<{
  tournaments: readonly AdminTournamentDto[];
  canUpdate: boolean;
  canDelete: boolean;
}>();

const emit = defineEmits<{
  delete: [tournament: AdminTournamentDto];
}>();
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

.td--title {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.title-link {
  font-weight: 500;
  color: #1e293b;
  text-decoration: none;
}

.title-link:hover {
  color: #3b82f6;
  text-decoration: underline;
}

.td--slug {
  color: #64748b;
  font-size: 0.75rem;
  font-family: monospace;
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
  text-decoration: none;
  display: inline-block;
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
