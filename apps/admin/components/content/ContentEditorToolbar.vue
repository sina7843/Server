<template>
  <div v-if="editor" class="toolbar" role="toolbar" aria-label="ابزارهای ویرایشگر">
    <!-- Paragraph / Headings -->
    <button
      type="button"
      class="tb-btn"
      :class="{ 'tb-btn--active': editor.isActive('paragraph') }"
      title="پاراگراف"
      @click="editor.chain().focus().setParagraph().run()"
    >
      ¶
    </button>
    <button
      v-for="lvl in [1, 2, 3] as const"
      :key="lvl"
      type="button"
      class="tb-btn"
      :class="{ 'tb-btn--active': editor.isActive('heading', { level: lvl }) }"
      :title="`عنوان ${lvl}`"
      @click="editor.chain().focus().toggleHeading({ level: lvl }).run()"
    >
      H{{ lvl }}
    </button>

    <span class="tb-sep" />

    <!-- Inline marks -->
    <button
      type="button"
      class="tb-btn tb-btn--icon"
      :class="{ 'tb-btn--active': editor.isActive('bold') }"
      title="درشت (Bold)"
      @click="editor.chain().focus().toggleBold().run()"
    >
      <strong>B</strong>
    </button>
    <button
      type="button"
      class="tb-btn tb-btn--icon"
      :class="{ 'tb-btn--active': editor.isActive('italic') }"
      title="کج (Italic)"
      @click="editor.chain().focus().toggleItalic().run()"
    >
      <em>I</em>
    </button>
    <button
      type="button"
      class="tb-btn tb-btn--icon"
      :class="{ 'tb-btn--active': editor.isActive('underline') }"
      title="زیرخط (Underline)"
      @click="editor.chain().focus().toggleUnderline().run()"
    >
      <u>U</u>
    </button>
    <button
      type="button"
      class="tb-btn tb-btn--icon"
      :class="{ 'tb-btn--active': editor.isActive('strike') }"
      title="خط‌خورده (Strikethrough)"
      @click="editor.chain().focus().toggleStrike().run()"
    >
      <s>S</s>
    </button>
    <button
      type="button"
      class="tb-btn tb-btn--icon"
      :class="{ 'tb-btn--active': editor.isActive('code') }"
      title="کد درون‌خطی (Inline code)"
      @click="editor.chain().focus().toggleCode().run()"
    >
      &lt;&gt;
    </button>

    <span class="tb-sep" />

    <!-- Link -->
    <template v-if="!linkInputOpen">
      <button
        type="button"
        class="tb-btn"
        :class="{ 'tb-btn--active': editor.isActive('link') }"
        title="لینک"
        @click="openLinkInput"
      >
        🔗
      </button>
      <button
        v-if="editor.isActive('link')"
        type="button"
        class="tb-btn tb-btn--danger"
        title="حذف لینک"
        @click="editor.chain().focus().unsetLink().run()"
      >
        ✕
      </button>
    </template>
    <template v-else>
      <input
        ref="linkInputRef"
        v-model="linkUrl"
        class="tb-link-input"
        type="text"
        placeholder="https://example.com"
        @keydown.enter.prevent="applyLink"
        @keydown.escape.prevent="closeLinkInput"
      />
      <button type="button" class="tb-btn tb-btn--confirm" title="تأیید" @click="applyLink">
        ✓
      </button>
      <button type="button" class="tb-btn" title="لغو" @click="closeLinkInput">✕</button>
      <span v-if="linkError" class="tb-link-error">{{ linkError }}</span>
    </template>

    <span class="tb-sep" />

    <!-- Block elements -->
    <button
      type="button"
      class="tb-btn"
      :class="{ 'tb-btn--active': editor.isActive('blockquote') }"
      title="نقل‌قول (Blockquote)"
      @click="editor.chain().focus().toggleBlockquote().run()"
    >
      "
    </button>
    <button
      type="button"
      class="tb-btn"
      :class="{ 'tb-btn--active': editor.isActive('bulletList') }"
      title="لیست نقطه‌ای"
      @click="editor.chain().focus().toggleBulletList().run()"
    >
      •—
    </button>
    <button
      type="button"
      class="tb-btn"
      :class="{ 'tb-btn--active': editor.isActive('orderedList') }"
      title="لیست شماره‌دار"
      @click="editor.chain().focus().toggleOrderedList().run()"
    >
      1.
    </button>
    <button
      type="button"
      class="tb-btn"
      :class="{ 'tb-btn--active': editor.isActive('codeBlock') }"
      title="بلاک کد"
      @click="editor.chain().focus().toggleCodeBlock().run()"
    >
      { }
    </button>

    <span class="tb-sep" />

    <!-- Table -->
    <button
      type="button"
      class="tb-btn"
      :class="{ 'tb-btn--active': editor.isActive('table') }"
      title="درج جدول"
      @click="insertTable"
    >
      ⊞
    </button>
    <template v-if="editor.isActive('table')">
      <button
        type="button"
        class="tb-btn tb-btn--sm"
        title="افزودن ستون"
        @click="editor.chain().focus().addColumnAfter().run()"
      >
        +col
      </button>
      <button
        type="button"
        class="tb-btn tb-btn--sm"
        title="افزودن ردیف"
        @click="editor.chain().focus().addRowAfter().run()"
      >
        +row
      </button>
      <button
        type="button"
        class="tb-btn tb-btn--sm tb-btn--danger"
        title="حذف جدول"
        @click="editor.chain().focus().deleteTable().run()"
      >
        del⊞
      </button>
    </template>

    <span class="tb-sep" />

    <!-- Horizontal rule -->
    <button
      type="button"
      class="tb-btn"
      title="خط افقی"
      @click="editor.chain().focus().setHorizontalRule().run()"
    >
      ─
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';

const props = defineProps<{
  editor: Editor | undefined;
}>();

const linkInputOpen = ref(false);
const linkUrl = ref('');
const linkError = ref('');
const linkInputRef = ref<HTMLInputElement | null>(null);

function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^\s*javascript\s*:/i.test(trimmed)) return false;
  if (/^\s*data\s*:/i.test(trimmed)) return false;
  if (/^\s*vbscript\s*:/i.test(trimmed)) return false;
  if (trimmed.startsWith('//')) return false;
  return true;
}

function openLinkInput() {
  linkError.value = '';
  linkUrl.value = props.editor?.getAttributes('link').href ?? '';
  linkInputOpen.value = true;
  nextTick(() => linkInputRef.value?.focus());
}

function closeLinkInput() {
  linkInputOpen.value = false;
  linkUrl.value = '';
  linkError.value = '';
}

function applyLink() {
  const url = linkUrl.value.trim();
  if (!url) {
    props.editor?.chain().focus().unsetLink().run();
    closeLinkInput();
    return;
  }
  if (!isSafeUrl(url)) {
    linkError.value = 'آدرس ناامن است. فقط http://, https://, mailto: مجاز هستند.';
    return;
  }
  props.editor?.chain().focus().setLink({ href: url }).run();
  closeLinkInput();
}

function insertTable() {
  props.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
}
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem;
  padding: 0.35rem 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-bottom: none;
  border-radius: 0.5rem 0.5rem 0 0;
}

.tb-sep {
  display: inline-block;
  width: 1px;
  height: 1.1rem;
  background: #cbd5e1;
  margin-inline: 0.2rem;
}

.tb-btn {
  padding: 0.15rem 0.4rem;
  min-width: 1.75rem;
  border: 1px solid transparent;
  border-radius: 0.3rem;
  background: transparent;
  font-size: 0.8rem;
  font-family: inherit;
  cursor: pointer;
  color: #374151;
  transition:
    background 0.1s,
    border-color 0.1s;
  line-height: 1.4;
}

.tb-btn:hover {
  background: #e2e8f0;
}

.tb-btn--active {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.tb-btn--sm {
  font-size: 0.72rem;
  padding: 0.1rem 0.3rem;
}

.tb-btn--icon {
  font-style: normal;
}

.tb-btn--danger {
  color: #dc2626;
}

.tb-btn--danger:hover {
  background: #fee2e2;
}

.tb-btn--confirm {
  color: #166534;
}

.tb-btn--confirm:hover {
  background: #dcfce7;
}

.tb-link-input {
  padding: 0.15rem 0.4rem;
  border: 1px solid #93c5fd;
  border-radius: 0.3rem;
  font-size: 0.8rem;
  outline: none;
  min-width: 180px;
}

.tb-link-input:focus {
  border-color: #3b82f6;
}

.tb-link-error {
  font-size: 0.75rem;
  color: #dc2626;
}
</style>
