<template>
  <div class="lifecycle-actions">
    <template v-if="status === 'draft'">
      <button
        v-if="canPublish"
        class="action-btn action-btn--primary"
        type="button"
        :disabled="loading"
        @click="emit('publish')"
      >
        انتشار
      </button>
      <button
        v-if="canCancel"
        class="action-btn action-btn--warning"
        type="button"
        :disabled="loading"
        @click="emit('cancel')"
      >
        لغو
      </button>
      <button
        v-if="canArchive"
        class="action-btn action-btn--neutral"
        type="button"
        :disabled="loading"
        @click="emit('archive')"
      >
        بایگانی
      </button>
    </template>

    <template v-else-if="status === 'published'">
      <button
        v-if="canPublish"
        class="action-btn action-btn--primary"
        type="button"
        :disabled="loading"
        @click="emit('openRegistration')"
      >
        باز کردن ثبت‌نام
      </button>
      <button
        v-if="canCancel"
        class="action-btn action-btn--warning"
        type="button"
        :disabled="loading"
        @click="emit('cancel')"
      >
        لغو
      </button>
    </template>

    <template v-else-if="status === 'registration_open'">
      <button
        v-if="canPublish"
        class="action-btn action-btn--primary"
        type="button"
        :disabled="loading"
        @click="emit('closeRegistration')"
      >
        بستن ثبت‌نام
      </button>
      <button
        v-if="canCancel"
        class="action-btn action-btn--warning"
        type="button"
        :disabled="loading"
        @click="emit('cancel')"
      >
        لغو
      </button>
    </template>

    <template v-else-if="status === 'registration_closed'">
      <button
        v-if="canPublish"
        class="action-btn action-btn--primary"
        type="button"
        :disabled="loading"
        @click="emit('start')"
      >
        شروع تورنمنت
      </button>
      <button
        v-if="canCancel"
        class="action-btn action-btn--warning"
        type="button"
        :disabled="loading"
        @click="emit('cancel')"
      >
        لغو
      </button>
    </template>

    <template v-else-if="status === 'in_progress'">
      <button
        v-if="canPublish"
        class="action-btn action-btn--primary"
        type="button"
        :disabled="loading"
        @click="emit('complete')"
      >
        پایان تورنمنت
      </button>
      <button
        v-if="canCancel"
        class="action-btn action-btn--warning"
        type="button"
        :disabled="loading"
        @click="emit('cancel')"
      >
        لغو
      </button>
    </template>

    <template v-else-if="status === 'completed' || status === 'cancelled'">
      <button
        v-if="canArchive"
        class="action-btn action-btn--neutral"
        type="button"
        :disabled="loading"
        @click="emit('archive')"
      >
        بایگانی
      </button>
    </template>

    <!-- archived: terminal state, no actions -->
  </div>
</template>

<script setup lang="ts">
import type { TournamentStatus } from '@dragon/types';

defineProps<{
  status: TournamentStatus;
  loading: boolean;
  canPublish: boolean;
  canCancel: boolean;
  canArchive: boolean;
}>();

const emit = defineEmits<{
  publish: [];
  openRegistration: [];
  closeRegistration: [];
  start: [];
  complete: [];
  cancel: [];
  archive: [];
}>();
</script>

<style scoped>
.lifecycle-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--motion-fast);
}

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.action-btn--primary {
  background: var(--purple-500);
  color: #fff;
  box-shadow:
    0 6px 20px -6px rgba(109, 40, 217, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.action-btn--primary:not(:disabled):hover {
  background: var(--purple-400);
}

.action-btn--warning {
  background: var(--danger-500);
  color: #fff;
  box-shadow:
    0 6px 18px -6px rgba(239, 68, 68, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.action-btn--warning:not(:disabled):hover {
  background: var(--danger-400);
}

.action-btn--neutral {
  background: var(--hover-overlay);
  color: var(--text-secondary);
  border-color: var(--border-default);
}

.action-btn--neutral:not(:disabled):hover {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
}
</style>
