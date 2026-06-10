<template>
  <form class="upload-form" @submit.prevent="onSubmit">
    <div
      class="drop-zone"
      :class="{ 'drop-zone--drag': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        class="file-input"
        @change="onFileChange"
      />
      <div v-if="!selectedFile" class="drop-hint" @click="fileInputRef?.click()">
        <span class="drop-icon">📁</span>
        <p class="drop-text">فایل را اینجا بکشید یا کلیک کنید</p>
        <p class="drop-sub">JPEG، PNG، WebP، GIF — حداکثر ۱۰ مگابایت</p>
      </div>
      <div v-else class="file-preview">
        <img v-if="previewUrl" :src="previewUrl" alt="پیش‌نمایش" class="preview-img" />
        <div class="file-info">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">{{ formattedSize }}</span>
        </div>
        <button type="button" class="remove-btn" @click="clearFile">حذف</button>
      </div>
    </div>

    <div v-if="fileError" class="field-error">{{ fileError }}</div>

    <div v-if="selectedFile && originalDimensions" class="resize-section">
      <div class="resize-header">
        <label class="resize-toggle-label">
          <input v-model="enableResize" type="checkbox" class="resize-toggle-check" />
          تغییر اندازه
        </label>
        <span class="orig-dims">اصلی: {{ originalDimensions.width }} × {{ originalDimensions.height }} px</span>
      </div>

      <div v-if="enableResize" class="resize-body">
        <div class="resize-presets">
          <button
            v-for="p in RESIZE_PRESETS"
            :key="p.label"
            type="button"
            class="preset-btn"
            :class="{ 'preset-btn--active': resizeWidth === p.w && resizeHeight === p.h }"
            @click="applyPreset(p)"
          >{{ p.label }}</button>
        </div>

        <div class="resize-inputs">
          <div class="dim-field">
            <label class="dim-label">عرض (px)</label>
            <input
              v-model.number="resizeWidth"
              type="number"
              min="1"
              max="8000"
              class="dim-input"
              @change="onWidthChange"
            />
          </div>

          <button type="button" class="lock-btn" :class="{ 'lock-btn--on': lockAspectRatio }" @click="lockAspectRatio = !lockAspectRatio" :title="lockAspectRatio ? 'قفل نسبت: فعال' : 'قفل نسبت: غیرفعال'">
            {{ lockAspectRatio ? '🔒' : '🔓' }}
          </button>

          <div class="dim-field">
            <label class="dim-label">ارتفاع (px)</label>
            <input
              v-model.number="resizeHeight"
              type="number"
              min="1"
              max="8000"
              class="dim-input"
              @change="onHeightChange"
            />
          </div>
        </div>

        <p v-if="selectedFile?.type === 'image/gif'" class="resize-warn">⚠️ GIF متحرک پس از تغییر اندازه فقط فریم اول باقی می‌ماند.</p>
      </div>
    </div>

    <div class="field-group">
      <div class="field">
        <label class="field-label">نمایش</label>
        <select v-model="form.visibility" class="field-select">
          <option value="public">عمومی</option>
          <option value="private">خصوصی</option>
        </select>
      </div>

      <div class="field">
        <label class="field-label">متن جایگزین (alt)</label>
        <input
          v-model="form.alt"
          class="field-input"
          type="text"
          maxlength="500"
          placeholder="توضیح تصویر برای کاربران کم‌بینا"
        />
      </div>
    </div>

    <div class="field">
      <label class="field-label">کپشن</label>
      <input
        v-model="form.caption"
        class="field-input"
        type="text"
        maxlength="500"
        placeholder="متن زیر تصویر (اختیاری)"
      />
    </div>

    <div v-if="actionError" class="form-error" role="alert">{{ actionError }}</div>
    <div v-if="actionSuccess" class="form-success" role="status">{{ actionSuccess }}</div>

    <div class="form-actions">
      <slot name="cancel" />
      <button class="submit-btn" type="submit" :disabled="actionLoading || !selectedFile">
        <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
        آپلود
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { AdminMediaAssetDto } from '@dragon/sdk';

const emit = defineEmits<{
  uploaded: [asset: AdminMediaAssetDto];
}>();

const { uploadMedia, actionLoading, actionError, actionSuccess, clearActionState } =
  useAdminMedia();

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const fileError = ref<string | null>(null);
const isDragging = ref(false);

const originalDimensions = ref<{ width: number; height: number } | null>(null);
const resizeWidth = ref<number | null>(null);
const resizeHeight = ref<number | null>(null);
const lockAspectRatio = ref(true);
const enableResize = ref(false);

const RESIZE_PRESETS = [
  { label: 'اصلی', w: 0, h: 0 },
  { label: '1920px', w: 1920, h: 0 },
  { label: '1280px', w: 1280, h: 0 },
  { label: '800px', w: 800, h: 0 },
  { label: '400px', w: 400, h: 0 },
];

const form = reactive({
  visibility: 'public' as 'public' | 'private',
  alt: '',
  caption: '',
});

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 10 * 1024 * 1024;

const formattedSize = computed(() => {
  const b = selectedFile.value?.size ?? 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
});

function detectDimensions(file: File) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    originalDimensions.value = { width: img.naturalWidth, height: img.naturalHeight };
    resizeWidth.value = img.naturalWidth;
    resizeHeight.value = img.naturalHeight;
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function applyPreset(preset: { label: string; w: number; h: number }) {
  if (!originalDimensions.value) return;
  if (preset.w === 0) {
    resizeWidth.value = originalDimensions.value.width;
    resizeHeight.value = originalDimensions.value.height;
  } else {
    resizeWidth.value = preset.w;
    const ratio = originalDimensions.value.height / originalDimensions.value.width;
    resizeHeight.value = Math.round(preset.w * ratio);
  }
}

function onWidthChange() {
  if (lockAspectRatio.value && originalDimensions.value && resizeWidth.value) {
    const ratio = originalDimensions.value.height / originalDimensions.value.width;
    resizeHeight.value = Math.round(resizeWidth.value * ratio);
  }
}

function onHeightChange() {
  if (lockAspectRatio.value && originalDimensions.value && resizeHeight.value) {
    const ratio = originalDimensions.value.width / originalDimensions.value.height;
    resizeWidth.value = Math.round(resizeHeight.value * ratio);
  }
}

async function resizeImage(file: File, width: number, height: number): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const mimeType = file.type === 'image/gif' ? 'image/png' : file.type;
      const ext = mimeType.split('/')[1];
      const name = file.name.replace(/\.[^.]+$/, `.${ext}`);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], name, { type: mimeType }) : file),
        mimeType,
        0.92,
      );
    };
    img.src = url;
  });
}

function validateAndSet(file: File): boolean {
  fileError.value = null;
  if (!ALLOWED_TYPES.has(file.type)) {
    fileError.value = 'فرمت فایل پشتیبانی نمی‌شود. تنها JPEG، PNG، WebP و GIF مجاز است.';
    return false;
  }
  if (file.size > MAX_BYTES) {
    fileError.value = 'حجم فایل از ۱۰ مگابایت بیشتر است.';
    return false;
  }
  selectedFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
  enableResize.value = false;
  originalDimensions.value = null;
  detectDimensions(file);
  return true;
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) validateAndSet(file);
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) validateAndSet(file);
}

function clearFile() {
  selectedFile.value = null;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null;
  fileError.value = null;
  originalDimensions.value = null;
  resizeWidth.value = null;
  resizeHeight.value = null;
  enableResize.value = false;
  if (fileInputRef.value) fileInputRef.value.value = '';
}

async function onSubmit() {
  if (!selectedFile.value) return;
  clearActionState();

  let fileToUpload = selectedFile.value;
  if (
    enableResize.value &&
    resizeWidth.value &&
    resizeHeight.value &&
    originalDimensions.value &&
    (resizeWidth.value !== originalDimensions.value.width ||
      resizeHeight.value !== originalDimensions.value.height)
  ) {
    fileToUpload = await resizeImage(selectedFile.value, resizeWidth.value, resizeHeight.value);
  }

  const asset = await uploadMedia({
    file: fileToUpload,
    filename: fileToUpload.name,
    mimeType: fileToUpload.type,
    visibility: form.visibility,
    ...(form.alt.trim() ? { alt: form.alt.trim() } : {}),
    ...(form.caption.trim() ? { caption: form.caption.trim() } : {}),
  });

  if (asset) {
    clearFile();
    emit('uploaded', asset);
  }
}

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});
</script>

<style scoped>
.upload-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color 0.15s,
    background 0.15s;
  position: relative;
}

.drop-zone--drag {
  border-color: #3b82f6;
  background: #eff6ff;
}

.file-input {
  display: none;
}

.drop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 1.5rem;
  text-align: center;
  width: 100%;
}

.drop-icon {
  font-size: 2rem;
}

.drop-text {
  font-size: 0.9rem;
  color: #374151;
  margin: 0;
}

.drop-sub {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
}

.preview-img {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 0.25rem;
  border: 1px solid #e5e7eb;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-size: 0.85rem;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 0.75rem;
  color: #6b7280;
}

.remove-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  background: #fff;
  color: #dc2626;
  font-size: 0.8rem;
  cursor: pointer;
}

.remove-btn:hover {
  background: #fee2e2;
}

.resize-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.resize-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.resize-toggle-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.resize-toggle-check {
  accent-color: #3b82f6;
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.orig-dims {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-right: auto;
}

.resize-body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.resize-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.preset-btn {
  padding: 0.2rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  background: #fff;
  font-size: 0.75rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.1s;
}

.preset-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.preset-btn--active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 500;
}

.resize-inputs {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.dim-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.dim-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.dim-input {
  padding: 0.4rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  width: 100%;
}

.dim-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px #bfdbfe;
}

.lock-btn {
  padding: 0.4rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: #fff;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  transition: all 0.1s;
  flex-shrink: 0;
  margin-bottom: 0;
}

.lock-btn--on {
  border-color: #3b82f6;
  background: #eff6ff;
}

.resize-warn {
  font-size: 0.75rem;
  color: #92400e;
  background: #fef3c7;
  border-radius: 0.25rem;
  padding: 0.35rem 0.5rem;
  margin: 0;
}

.field-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

.field-input,
.field-select {
  padding: 0.45rem 0.65rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  background: #fff;
  width: 100%;
}

.field-input:focus,
.field-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px #bfdbfe;
}

.field-error {
  font-size: 0.8rem;
  color: #dc2626;
}

.form-error {
  padding: 0.6rem 0.75rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.375rem;
  font-size: 0.85rem;
}

.form-success {
  padding: 0.6rem 0.75rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 0.375rem;
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.25rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.submit-btn:hover:not(:disabled) {
  background: #2563eb;
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-spinner {
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
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
