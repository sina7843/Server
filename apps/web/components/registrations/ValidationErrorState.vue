<template>
  <div class="validation-error-state" role="alert">
    <p>Please fix the following errors:</p>
    <ul>
      <li v-for="[field, message] in Object.entries(errors)" :key="field">{{ message }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  errors: Record<string, string>;
}>();
</script>

<style scoped>
.validation-error-state {
  padding: 1rem 1.25rem;
  background: #fee2e2;
  border-radius: 0.375rem;
  border: 1px solid #fca5a5;
  color: #991b1b;
}

.validation-error-state ul {
  margin: 0.5rem 0 0;
  padding-right: 1.25rem;
}

.validation-error-state li {
  font-size: 0.875rem;
}
</style>
