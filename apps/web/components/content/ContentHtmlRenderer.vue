<template>
  <!-- html prop must be server-sanitized bodyHtml (Task 0.6.3). Never pass raw user input. -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="content-html" v-html="html" />
</template>

<script setup lang="ts">
defineProps<{
  html: string;
}>();
</script>

<style scoped>
.content-html :deep(h1),
.content-html :deep(h2),
.content-html :deep(h3) {
  font-weight: 700;
  line-height: 1.3;
  margin: 1em 0 0.4em;
}

.content-html :deep(h1) {
  font-size: 1.5em;
}
.content-html :deep(h2) {
  font-size: 1.25em;
}
.content-html :deep(h3) {
  font-size: 1.1em;
}

.content-html :deep(p) {
  margin: 0 0 0.75em;
  line-height: 1.7;
}

.content-html :deep(ul),
.content-html :deep(ol) {
  padding-inline-start: 1.5rem;
  margin: 0 0 0.75em;
}

.content-html :deep(blockquote) {
  border-inline-start: 3px solid #cbd5e1;
  margin-inline-start: 0;
  padding-inline-start: 0.75rem;
  color: #64748b;
}

.content-html :deep(pre) {
  background: #f1f5f9;
  border-radius: 0.3rem;
  padding: 0.5rem 0.75rem;
  font-family: monospace;
  font-size: 0.875em;
  overflow-x: auto;
}

.content-html :deep(code) {
  background: #f1f5f9;
  border-radius: 0.2rem;
  padding: 0.1em 0.3em;
  font-family: monospace;
  font-size: 0.875em;
}

.content-html :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

.content-html :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75em 0;
}

.content-html :deep(td),
.content-html :deep(th) {
  border: 1px solid #cbd5e1;
  padding: 0.35rem 0.6rem;
  vertical-align: top;
}

.content-html :deep(th) {
  background: #f8fafc;
  font-weight: 600;
}

.content-html :deep(hr) {
  border: none;
  border-top: 2px solid #e2e8f0;
  margin: 1em 0;
}
</style>
