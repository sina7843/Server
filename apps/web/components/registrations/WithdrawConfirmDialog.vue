<template>
  <div
    class="withdraw-confirm-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="withdraw-title"
  >
    <h2 id="withdraw-title">Withdraw from tournament?</h2>
    <p>This action cannot be undone. Your registration will be withdrawn.</p>
    <div class="dialog-actions">
      <button class="confirm-btn" :disabled="submitting" @click="$emit('confirm')">
        {{ submitting ? 'Withdrawing…' : 'Withdraw' }}
      </button>
      <button class="cancel-btn" :disabled="submitting" @click="$emit('cancel')">Cancel</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  submitting?: boolean;
}>();

defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<style scoped>
.withdraw-confirm-dialog {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.withdraw-confirm-dialog > * {
  background: #fff;
  max-width: 28rem;
  width: 100%;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.confirm-btn {
  padding: 0.45rem 1rem;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 0.45rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
