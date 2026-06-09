<template>
  <form class="form" @submit.prevent="onSubmit">
    <div class="field">
      <label for="game-select" class="field-label">
        بازی
        <span v-if="gamesLoading" class="field-hint">(در حال بارگذاری...)</span>
      </label>
      <select
        id="game-select"
        v-model="form.gameId"
        class="field-select"
        required
        :disabled="editMode"
      >
        <option value="" disabled>انتخاب بازی</option>
        <option v-for="g in games" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
      <span v-if="errors.gameId" class="field-error">{{ errors.gameId }}</span>
    </div>

    <div class="field">
      <label for="title-input" class="field-label">عنوان</label>
      <input
        id="title-input"
        v-model="form.title"
        class="field-input"
        type="text"
        placeholder="مثال: جام اژدها ۱۴۰۵"
        maxlength="200"
        required
      />
      <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
    </div>

    <div class="field">
      <label for="slug-input" class="field-label">
        اسلاگ
        <span class="field-hint">حروف کوچک، اعداد و خط تیره</span>
      </label>
      <input
        id="slug-input"
        v-model="form.slug"
        class="field-input"
        type="text"
        placeholder="مثال: dragon-cup-1405"
        maxlength="200"
        :disabled="editMode"
        required
      />
      <span v-if="errors.slug" class="field-error">{{ errors.slug }}</span>
    </div>

    <div class="field">
      <label for="format-select" class="field-label">فرمت</label>
      <select id="format-select" v-model="form.format" class="field-select" required>
        <option value="" disabled>انتخاب فرمت</option>
        <option value="single_elimination">حذفی ساده</option>
        <option value="round_robin">دوره‌ای</option>
        <option value="manual">دستی</option>
      </select>
      <span v-if="errors.format" class="field-error">{{ errors.format }}</span>
    </div>

    <div class="field">
      <label for="participant-type-select" class="field-label">نوع شرکت‌کننده</label>
      <select
        id="participant-type-select"
        v-model="form.participantType"
        class="field-select"
        required
      >
        <option value="" disabled>انتخاب نوع</option>
        <option value="individual">انفرادی</option>
        <option value="team">تیمی</option>
        <option value="both">هر دو</option>
      </select>
    </div>

    <div class="field">
      <label for="capacity-input" class="field-label">ظرفیت</label>
      <input
        id="capacity-input"
        v-model.number="form.capacity"
        class="field-input"
        type="number"
        min="1"
        step="1"
        placeholder="مثال: 64"
        required
      />
      <span v-if="errors.capacity" class="field-error">{{ errors.capacity }}</span>
    </div>

    <div class="field">
      <label for="desc-input" class="field-label">
        توضیحات
        <span class="field-hint">(اختیاری)</span>
      </label>
      <textarea
        id="desc-input"
        v-model="form.description"
        class="field-textarea"
        rows="3"
        maxlength="2000"
        placeholder="توضیح کوتاه درباره این تورنمنت…"
      />
    </div>

    <div class="field-row">
      <div class="field">
        <label for="reg-open-input" class="field-label">
          شروع ثبت‌نام
          <span class="field-hint">(اختیاری)</span>
        </label>
        <input
          id="reg-open-input"
          v-model="form.registrationOpenAt"
          class="field-input"
          type="datetime-local"
        />
      </div>
      <div class="field">
        <label for="reg-close-input" class="field-label">
          پایان ثبت‌نام
          <span class="field-hint">(اختیاری)</span>
        </label>
        <input
          id="reg-close-input"
          v-model="form.registrationCloseAt"
          class="field-input"
          type="datetime-local"
        />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="starts-at-input" class="field-label">
          تاریخ شروع
          <span class="field-hint">(اختیاری)</span>
        </label>
        <input
          id="starts-at-input"
          v-model="form.startsAt"
          class="field-input"
          type="datetime-local"
        />
      </div>
      <div class="field">
        <label for="ends-at-input" class="field-label">
          تاریخ پایان
          <span class="field-hint">(اختیاری)</span>
        </label>
        <input id="ends-at-input" v-model="form.endsAt" class="field-input" type="datetime-local" />
      </div>
    </div>

    <div class="field">
      <label for="rules-input" class="field-label">
        قوانین
        <span class="field-hint">(اختیاری)</span>
      </label>
      <textarea
        id="rules-input"
        v-model="form.rules"
        class="field-textarea"
        rows="4"
        maxlength="10000"
        placeholder="قوانین و مقررات تورنمنت…"
      />
    </div>

    <div class="field">
      <label class="field-label">
        پوستر تورنمنت
        <span class="field-hint">(اختیاری)</span>
      </label>
      <div class="cover-row">
        <img v-if="coverAssetUrl" :src="coverAssetUrl" alt="پوستر تورنمنت" class="cover-thumb" />
        <span v-else-if="form.coverMediaId" class="cover-id">شناسه: {{ form.coverMediaId }}</span>
        <span v-else class="cover-empty">انتخاب نشده</span>
        <div class="cover-btns">
          <button type="button" class="cover-btn" @click="coverPickerOpen = true">
            {{ form.coverMediaId ? 'تغییر' : 'انتخاب' }}
          </button>
          <button
            v-if="form.coverMediaId"
            type="button"
            class="cover-btn cover-btn--clear"
            @click="form.coverMediaId = null; coverAssetUrl = null;"
          >
            حذف
          </button>
        </div>
      </div>
      <MediaPickerDialog
        :open="coverPickerOpen"
        @select="(a) => { form.coverMediaId = a.id; coverAssetUrl = a.url ?? null; coverPickerOpen = false; }"
        @cancel="coverPickerOpen = false"
      />
    </div>

    <div v-if="actionError" class="form-error" role="alert">{{ actionError }}</div>

    <div class="form-actions">
      <NuxtLink to="/tournaments" class="cancel-btn">انصراف</NuxtLink>
      <button class="submit-btn" type="submit" :disabled="actionLoading">
        <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type {
  AdminTournamentDto,
  TournamentFormat,
  TournamentParticipantType,
  GameDto,
} from '@dragon/types';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

type TournamentFormInitial = Partial<AdminTournamentDto>;

const props = withDefaults(
  defineProps<{
    initial?: TournamentFormInitial;
    games?: readonly GameDto[];
    gamesLoading?: boolean;
    editMode?: boolean;
    actionLoading?: boolean;
    actionError?: string | null;
    submitLabel?: string;
  }>(),
  {
    initial: undefined,
    games: () => [],
    gamesLoading: false,
    editMode: false,
    actionLoading: false,
    actionError: null,
    submitLabel: 'ذخیره',
  },
);

function isoToLocal(iso?: string): string {
  if (!iso) return '';
  return iso.substring(0, 16);
}

const form = reactive({
  gameId: props.initial?.gameId ?? '',
  title: props.initial?.title ?? '',
  slug: props.initial?.slug ?? '',
  format: (props.initial?.format ?? '') as TournamentFormat | '',
  participantType: (props.initial?.participantType ?? 'individual') as TournamentParticipantType,
  capacity: props.initial?.capacity ?? 1,
  description: props.initial?.description ?? '',
  rules: props.initial?.rules ?? '',
  registrationOpenAt: isoToLocal(props.initial?.registrationOpenAt),
  registrationCloseAt: isoToLocal(props.initial?.registrationCloseAt),
  startsAt: isoToLocal(props.initial?.startsAt),
  endsAt: isoToLocal(props.initial?.endsAt),
  coverMediaId: (props.initial?.coverMediaId ?? null) as string | null,
});

const coverPickerOpen = ref(false);
const coverAssetUrl = ref<string | null>(props.initial?.coverImageUrl ?? null);

const errors = reactive({ gameId: '', title: '', slug: '', format: '', capacity: '' });

type TournamentFormPayload = {
  gameId: string;
  title: string;
  slug: string;
  format: TournamentFormat;
  participantType: TournamentParticipantType;
  capacity: number;
  description?: string;
  rules?: string;
  registrationOpenAt?: string;
  registrationCloseAt?: string;
  startsAt?: string;
  endsAt?: string;
  coverMediaId?: string | null;
};

const emit = defineEmits<{
  submit: [data: TournamentFormPayload];
}>();

function validate(): boolean {
  errors.gameId = '';
  errors.title = '';
  errors.slug = '';
  errors.format = '';
  errors.capacity = '';

  if (!form.gameId) {
    errors.gameId = 'انتخاب بازی الزامی است.';
    return false;
  }
  if (!form.title.trim()) {
    errors.title = 'عنوان الزامی است.';
    return false;
  }
  if (!props.editMode) {
    if (!form.slug.trim()) {
      errors.slug = 'اسلاگ الزامی است.';
      return false;
    }
    if (!SLUG_PATTERN.test(form.slug)) {
      errors.slug =
        'اسلاگ باید با حرف یا عدد شروع شود و فقط حروف کوچک، اعداد و خط تیره داشته باشد.';
      return false;
    }
  }
  if (!form.format) {
    errors.format = 'انتخاب فرمت الزامی است.';
    return false;
  }
  if (!Number.isInteger(form.capacity) || form.capacity < 1) {
    errors.capacity = 'ظرفیت باید یک عدد صحیح بزرگ‌تر از صفر باشد.';
    return false;
  }

  return true;
}

function localToIso(local: string): string | undefined {
  if (!local) return undefined;
  return new Date(local).toISOString();
}

function onSubmit() {
  if (!validate()) return;

  const payload: TournamentFormPayload = {
    gameId: form.gameId,
    title: form.title.trim(),
    slug: form.slug,
    format: form.format as TournamentFormat,
    participantType: form.participantType,
    capacity: form.capacity,
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
    ...(form.rules.trim() ? { rules: form.rules.trim() } : {}),
    ...(form.registrationOpenAt ? { registrationOpenAt: localToIso(form.registrationOpenAt) } : {}),
    ...(form.registrationCloseAt
      ? { registrationCloseAt: localToIso(form.registrationCloseAt) }
      : {}),
    ...(form.startsAt ? { startsAt: localToIso(form.startsAt) } : {}),
    ...(form.endsAt ? { endsAt: localToIso(form.endsAt) } : {}),
    coverMediaId: form.coverMediaId,
  };

  emit('submit', payload);
}
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.field-hint {
  font-weight: 400;
  color: #9ca3af;
  margin-inline-start: 0.3rem;
  font-size: 0.8rem;
}

.field-input,
.field-select,
.field-textarea {
  padding: 0.5rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  background: #fff;
  color: #1e293b;
}

.field-input:focus,
.field-select:focus,
.field-textarea:focus {
  border-color: #3b82f6;
}

.field-input:disabled,
.field-select:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.field-textarea {
  resize: vertical;
}

.field-error {
  font-size: 0.8rem;
  color: #dc2626;
}

.form-error {
  font-size: 0.85rem;
  color: #dc2626;
  background: #fee2e2;
  padding: 0.5rem 0.85rem;
  border-radius: 0.4rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: flex-end;
  margin-block-start: 0.25rem;
}

.cancel-btn {
  font-size: 0.9rem;
  color: #475569;
  text-decoration: none;
}

.cancel-btn:hover {
  text-decoration: underline;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.25rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.submit-btn:not(:disabled):hover {
  background: #2563eb;
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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

.cover-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.cover-thumb {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.cover-empty,
.cover-id {
  font-size: 0.85rem;
  color: #9ca3af;
}

.cover-btns {
  display: flex;
  gap: 0.4rem;
}

.cover-btn {
  padding: 0.3rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: #fff;
  color: #374151;
  font-size: 0.8rem;
  cursor: pointer;
}

.cover-btn:hover {
  background: #f3f4f6;
}

.cover-btn--clear {
  color: #dc2626;
  border-color: #fca5a5;
}

.cover-btn--clear:hover {
  background: #fee2e2;
}
</style>
