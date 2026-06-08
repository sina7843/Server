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
.content-html {
  color: var(--text-primary);
}

.content-html :deep(h1),
.content-html :deep(h2),
.content-html :deep(h3),
.content-html :deep(h4),
.content-html :deep(h5),
.content-html :deep(h6) {
  font-weight: 700;
  line-height: 1.3;
  margin: 1.6em 0 0.5em;
  color: var(--text-primary);
}

.content-html :deep(h1) { font-size: var(--text-h2-size); letter-spacing: var(--text-h2-tracking); }
.content-html :deep(h2) { font-size: var(--text-h3-size); letter-spacing: var(--text-h3-tracking); }
.content-html :deep(h3) { font-size: var(--text-h4-size); }
.content-html :deep(h4) { font-size: var(--text-body-lg-size); }

.content-html :deep(p) {
  margin: 0 0 1em;
  line-height: 1.8;
  color: var(--text-secondary);
}

.content-html :deep(ul),
.content-html :deep(ol) {
  padding-inline-start: 1.5rem;
  margin: 0 0 1em;
  color: var(--text-secondary);
}

.content-html :deep(li) {
  margin-bottom: 0.4em;
  line-height: 1.7;
}

.content-html :deep(blockquote) {
  border-inline-start: 3px solid var(--purple-500);
  margin-inline-start: 0;
  margin-inline-end: 0;
  padding: var(--space-4) var(--space-5);
  background: rgba(109, 40, 217, 0.06);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--text-secondary);
  font-style: italic;
}

.content-html :deep(pre) {
  background: var(--surface-elevated);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--space-5) var(--space-6);
  font-family: var(--font-mono);
  font-size: var(--text-mono-size);
  line-height: var(--text-mono-lh);
  overflow-x: auto;
  color: var(--text-primary);
}

.content-html :deep(code) {
  background: var(--surface-elevated);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xs);
  padding: 0.1em 0.4em;
  font-family: var(--font-mono);
  font-size: 0.875em;
  color: var(--cyan-300);
}

.content-html :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: var(--text-primary);
  font-size: inherit;
}

.content-html :deep(a) {
  color: var(--purple-300);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color var(--motion-fast) var(--ease-out);
}

.content-html :deep(a:hover) {
  color: var(--purple-200);
}

.content-html :deep(strong) {
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.content-html :deep(em) {
  color: var(--text-secondary);
}

.content-html :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.25em 0;
  font-size: var(--text-body-sm-size);
}

.content-html :deep(td),
.content-html :deep(th) {
  border: 1px solid var(--glass-border);
  padding: var(--space-2) var(--space-4);
  vertical-align: top;
  color: var(--text-secondary);
}

.content-html :deep(th) {
  background: var(--surface-elevated);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  text-align: start;
}

.content-html :deep(tr:nth-child(even) td) {
  background: var(--table-stripe);
}

.content-html :deep(hr) {
  border: none;
  border-top: 1px solid var(--glass-hairline);
  margin: 2em 0;
}

.content-html :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-md);
  display: block;
}
</style>
