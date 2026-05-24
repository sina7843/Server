<template>
  <div class="diff-viewer">
    <div v-if="before !== undefined" class="diff-section">
      <div class="diff-label diff-label--before">قبل</div>
      <pre class="diff-code diff-code--before">{{ formatJson(before) }}</pre>
    </div>
    <div v-if="after !== undefined" class="diff-section">
      <div class="diff-label diff-label--after">بعد</div>
      <pre class="diff-code diff-code--after">{{ formatJson(after) }}</pre>
    </div>
    <div v-if="metadata !== undefined" class="diff-section">
      <div class="diff-label">متادیتا</div>
      <pre class="diff-code">{{ formatJson(metadata) }}</pre>
    </div>
    <div
      v-if="before === undefined && after === undefined && metadata === undefined"
      class="diff-empty"
    >
      هیچ داده‌ای موجود نیست.
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

defineProps<Props>();

function formatJson(value: Record<string, unknown>): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '[غیرقابل نمایش]';
  }
}
</script>

<style scoped>
.diff-viewer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.diff-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

.diff-label {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.diff-label--before {
  background-color: #fef2f2;
  color: #b91c1c;
}

.diff-label--after {
  background-color: #f0fdf4;
  color: #15803d;
}

.diff-code {
  margin: 0;
  padding: 0.75rem;
  font-family: monospace;
  font-size: 0.8125rem;
  white-space: pre-wrap;
  word-break: break-all;
  background-color: #ffffff;
  color: #111827;
  max-height: 24rem;
  overflow-y: auto;
}

.diff-empty {
  color: #9ca3af;
  font-size: 0.875rem;
  font-style: italic;
}
</style>
