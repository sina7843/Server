<template>
  <div class="rte-outer">
    <ContentEditorToolbar :editor="editor" />
    <EditorContent :editor="editor" class="rte-content" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';

const props = defineProps<{
  modelValue: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, unknown>): void;
  (e: 'html', value: string): void;
}>();

function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t) return false;
  if (/^\s*javascript\s*:/i.test(t)) return false;
  if (/^\s*data\s*:/i.test(t)) return false;
  if (/^\s*vbscript\s*:/i.test(t)) return false;
  if (t.startsWith('//')) return false;
  return true;
}

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: false,
      validate: isSafeUrl,
    }),
    Table.configure({ resizable: false }),
    TableRow,
    TableCell,
    TableHeader,
  ],
  content: Object.keys(props.modelValue).length > 0 ? props.modelValue : null,
  onUpdate({ editor: e }) {
    emit('update:modelValue', e.getJSON() as Record<string, unknown>);
    emit('html', e.getHTML());
  },
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (!editor.value) return;
    const incoming = JSON.stringify(newVal);
    const current = JSON.stringify(editor.value.getJSON());
    if (incoming !== current) {
      editor.value.commands.setContent(Object.keys(newVal).length > 0 ? newVal : null, false);
    }
  },
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
.rte-outer {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.rte-outer:focus-within {
  border-color: #3b82f6;
}

/* ProseMirror editor area */
.rte-content :deep(.ProseMirror) {
  min-height: 200px;
  padding: 0.75rem 1rem;
  outline: none;
  font-size: 0.9rem;
  line-height: 1.7;
  color: #1e293b;
}

.rte-content :deep(.ProseMirror p) {
  margin: 0 0 0.6em;
}

.rte-content :deep(.ProseMirror h1),
.rte-content :deep(.ProseMirror h2),
.rte-content :deep(.ProseMirror h3) {
  font-weight: 700;
  margin: 1em 0 0.4em;
  line-height: 1.3;
}

.rte-content :deep(.ProseMirror h1) {
  font-size: 1.5em;
}
.rte-content :deep(.ProseMirror h2) {
  font-size: 1.25em;
}
.rte-content :deep(.ProseMirror h3) {
  font-size: 1.1em;
}

.rte-content :deep(.ProseMirror ul),
.rte-content :deep(.ProseMirror ol) {
  padding-inline-start: 1.5rem;
  margin: 0 0 0.6em;
}

.rte-content :deep(.ProseMirror blockquote) {
  border-inline-start: 3px solid #cbd5e1;
  margin-inline-start: 0;
  padding-inline-start: 0.75rem;
  color: #64748b;
}

.rte-content :deep(.ProseMirror pre) {
  background: #f1f5f9;
  border-radius: 0.3rem;
  padding: 0.5rem 0.75rem;
  font-family: monospace;
  font-size: 0.85em;
  overflow-x: auto;
}

.rte-content :deep(.ProseMirror code) {
  background: #f1f5f9;
  border-radius: 0.2rem;
  padding: 0.1em 0.3em;
  font-family: monospace;
  font-size: 0.85em;
}

.rte-content :deep(.ProseMirror a) {
  color: #2563eb;
  text-decoration: underline;
}

.rte-content :deep(.ProseMirror table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.6em 0;
}

.rte-content :deep(.ProseMirror td),
.rte-content :deep(.ProseMirror th) {
  border: 1px solid #cbd5e1;
  padding: 0.35rem 0.6rem;
  vertical-align: top;
}

.rte-content :deep(.ProseMirror th) {
  background: #f8fafc;
  font-weight: 600;
}

.rte-content :deep(.ProseMirror .selectedCell) {
  background: #eff6ff;
}

.rte-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #94a3b8;
  pointer-events: none;
  height: 0;
}

.rte-content :deep(.ProseMirror hr) {
  border: none;
  border-top: 2px solid #e2e8f0;
  margin: 0.8em 0;
}
</style>
