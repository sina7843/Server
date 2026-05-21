<template>
  <tr class="session-row" :class="{ 'session-row--inactive': !session.isActive }">
    <td class="cell">
      <span class="device">{{ session.deviceName ?? 'دستگاه ناشناس' }}</span>
      <span v-if="session.userAgent" class="ua">{{ shortAgent(session.userAgent) }}</span>
    </td>
    <td class="cell cell-status">
      <span class="status-dot" :class="session.isActive ? 'dot--active' : 'dot--inactive'" />
      {{ session.isActive ? 'فعال' : 'غیرفعال' }}
    </td>
    <td class="cell cell-date">{{ formatDate(session.createdAt) }}</td>
    <td class="cell cell-date">{{ formatDate(session.expiresAt) }}</td>
    <td class="cell cell-actions">
      <button
        v-if="session.isActive && canRevoke"
        class="revoke-btn"
        type="button"
        :disabled="revoking"
        @click="emit('revoke', session.id)"
      >
        ابطال
      </button>
      <span v-else-if="session.revokedReason" class="revoked-label">ابطال‌شده</span>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { AdminUserSessionSummary } from '@dragon/sdk';

defineProps<{
  session: AdminUserSessionSummary;
  canRevoke: boolean;
  revoking?: boolean;
}>();

const emit = defineEmits<{ revoke: [sessionId: string] }>();

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function shortAgent(ua: string) {
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return ua.slice(0, 30);
}
</script>

<style scoped>
.session-row--inactive {
  opacity: 0.6;
}

.cell {
  padding: 0.65rem 1rem;
  border-block-end: 1px solid #f1f5f9;
  font-size: 0.855rem;
  color: #334155;
  vertical-align: middle;
}

.device {
  font-weight: 600;
  display: block;
}

.ua {
  font-size: 0.76rem;
  color: #64748b;
  display: block;
  margin-block-start: 0.1rem;
}

.cell-status {
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.status-dot {
  display: inline-block;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot--active {
  background: #22c55e;
}

.dot--inactive {
  background: #94a3b8;
}

.cell-date {
  white-space: nowrap;
  color: #64748b;
}

.cell-actions {
  white-space: nowrap;
}

.revoke-btn {
  font-size: 0.82rem;
  color: #ef4444;
  background: none;
  border: 1px solid #fca5a5;
  border-radius: 0.35rem;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
  transition: background 0.15s;
}

.revoke-btn:not(:disabled):hover {
  background: #fee2e2;
}

.revoke-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.revoked-label {
  font-size: 0.78rem;
  color: #94a3b8;
}
</style>
