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
  gap: 0.5rem;
}

.action-btn {
  padding: 0.45rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.15s,
    background 0.15s;
  display: inline-flex;
  align-items: center;
}

.action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.action-btn--primary {
  background: #3b82f6;
  color: #fff;
}

.action-btn--primary:not(:disabled):hover {
  background: #2563eb;
}

.action-btn--warning {
  background: #ef4444;
  color: #fff;
}

.action-btn--warning:not(:disabled):hover {
  background: #dc2626;
}

.action-btn--neutral {
  background: #64748b;
  color: #fff;
}

.action-btn--neutral:not(:disabled):hover {
  background: #475569;
}
</style>
