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
  background: rgba(11, 8, 21, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: 20px;
}

.dialog {
  background: var(--surface-card-solid);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 26px;
  max-width: 460px;
  width: 100%;
  box-shadow:
    var(--shadow-xl),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);
}

.dialog-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.dialog-desc {
  margin: 0 0 22px;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--motion-fast);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--hover-overlay);
  border-color: var(--border-default);
  color: var(--text-secondary);
}

.btn-cancel:not(:disabled):hover {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
}

.btn-confirm {
  background: var(--purple-500);
  color: #fff;
  box-shadow: 0 6px 20px -6px rgba(109, 40, 217, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.btn-confirm:not(:disabled):hover {
  background: var(--purple-400);
}

.btn-destructive {
  background: var(--danger-500);
  color: #fff;
  box-shadow: var(--glow-danger);
}

.btn-destructive:not(:disabled):hover {
  background: var(--danger-400);
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: dr-spin 0.7s linear infinite;
}
</style>
