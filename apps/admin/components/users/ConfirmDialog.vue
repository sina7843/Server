<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <div class="dialog">
        <h2 :id="titleId" class="dialog-title">{{ title }}</h2>
        <p v-if="description" class="dialog-desc">{{ description }}</p>
        <div class="dialog-actions">
          <button class="btn btn-cancel" type="button" :disabled="loading" @click="emit('cancel')">
            انصراف
          </button>
          <button
            class="btn"
            :class="destructive ? 'btn-destructive' : 'btn-confirm'"
            type="button"
            :disabled="loading"
            @click="emit('confirm')"
          >
            <span v-if="loading" class="btn-spinner" aria-hidden="true" />
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    destructive?: boolean;
    loading?: boolean;
  }>(),
  { confirmLabel: 'تأیید', destructive: false, loading: false },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const titleId = useId();
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-width: 420px;
  width: calc(100% - 2rem);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.dialog-title {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.dialog-desc {
  margin: 0 0 1.25rem;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.6;
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
}

.btn-cancel:not(:disabled):hover {
  background: #e2e8f0;
}

.btn-confirm {
  background: #3b82f6;
  color: #fff;
}

.btn-confirm:not(:disabled):hover {
  background: #2563eb;
}

.btn-destructive {
  background: #ef4444;
  color: #fff;
}

.btn-destructive:not(:disabled):hover {
  background: #dc2626;
}

.btn-spinner {
  width: 0.85rem;
  height: 0.85rem;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
