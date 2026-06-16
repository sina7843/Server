<template>
  <main class="contact-page">
    <div class="contact-inner">
      <!-- Page heading -->
      <header class="contact-header">
        <h1 class="contact-title">تماس با ما</h1>
      </header>

      <!-- Loading / error states for contact info -->
      <ContentStateMessage v-if="pending" state="loading" />
      <ContentStateMessage v-else-if="error" state="error" />

      <!-- Contact info block -->
      <section v-else-if="contact" class="contact-info">
        <ul class="contact-info__list">
          <li v-if="contact.email" class="contact-info__item">
            <span class="contact-info__label">ایمیل:</span>
            <a :href="`mailto:${contact.email}`" class="contact-info__link">{{ contact.email }}</a>
          </li>
          <li v-if="contact.phone" class="contact-info__item">
            <span class="contact-info__label">تلفن:</span>
            <a :href="`tel:${contact.phone}`" class="contact-info__link">{{ contact.phone }}</a>
          </li>
          <li v-if="contact.address" class="contact-info__item">
            <span class="contact-info__label">آدرس:</span>
            <span class="contact-info__text">{{ contact.address }}</span>
          </li>
          <li v-if="contact.socials && contact.socials.length" class="contact-info__item contact-info__item--socials">
            <span class="contact-info__label">شبکه‌های اجتماعی:</span>
            <div class="contact-info__socials">
              <a
                v-for="social in contact.socials"
                :key="social.platform"
                :href="social.url"
                class="contact-info__social-link"
                target="_blank"
                rel="noopener noreferrer"
              >{{ social.platform }}</a>
            </div>
          </li>
        </ul>

        <!-- Map embed -->
        <div v-if="contact.mapEmbedUrl" class="contact-map">
          <iframe
            :src="contact.mapEmbedUrl"
            class="contact-map__iframe"
            loading="lazy"
            title="موقعیت روی نقشه"
            allowfullscreen
          />
        </div>
      </section>

      <!-- Contact form -->
      <section class="contact-form-section">
        <h2 class="contact-form__heading">ارسال پیام</h2>

        <!-- Success message -->
        <div v-if="submitSuccess" class="form-notice form-notice--success" role="alert">
          پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.
        </div>

        <!-- Error message -->
        <div v-else-if="submitError" class="form-notice form-notice--error" role="alert">
          {{ submitError }}
        </div>

        <form v-if="!submitSuccess" class="contact-form" novalidate @submit.prevent="handleSubmit">
          <!-- Honeypot (hidden from humans) -->
          <div class="contact-form__honeypot" aria-hidden="true">
            <input
              v-model="form.website"
              type="text"
              name="website"
              autocomplete="off"
              tabindex="-1"
            />
          </div>

          <div class="contact-form__row">
            <div class="contact-form__field">
              <label for="contact-name" class="contact-form__label">نام <span class="contact-form__required" aria-hidden="true">*</span></label>
              <input
                id="contact-name"
                v-model="form.name"
                type="text"
                class="contact-form__input"
                :class="{ 'contact-form__input--error': fieldErrors.name }"
                autocomplete="name"
                :disabled="submitting"
              />
              <span v-if="fieldErrors.name" class="contact-form__error" role="alert">{{ fieldErrors.name }}</span>
            </div>

            <div class="contact-form__field">
              <label for="contact-email" class="contact-form__label">ایمیل <span class="contact-form__required" aria-hidden="true">*</span></label>
              <input
                id="contact-email"
                v-model="form.email"
                type="email"
                class="contact-form__input"
                :class="{ 'contact-form__input--error': fieldErrors.email }"
                autocomplete="email"
                :disabled="submitting"
              />
              <span v-if="fieldErrors.email" class="contact-form__error" role="alert">{{ fieldErrors.email }}</span>
            </div>
          </div>

          <div class="contact-form__field">
            <label for="contact-subject" class="contact-form__label">موضوع</label>
            <input
              id="contact-subject"
              v-model="form.subject"
              type="text"
              class="contact-form__input"
              autocomplete="off"
              :disabled="submitting"
            />
          </div>

          <div class="contact-form__field">
            <label for="contact-message" class="contact-form__label">پیام <span class="contact-form__required" aria-hidden="true">*</span></label>
            <textarea
              id="contact-message"
              v-model="form.message"
              class="contact-form__textarea"
              :class="{ 'contact-form__input--error': fieldErrors.message }"
              rows="6"
              :disabled="submitting"
            />
            <span v-if="fieldErrors.message" class="contact-form__error" role="alert">{{ fieldErrors.message }}</span>
          </div>

          <div class="contact-form__actions">
            <button type="submit" class="contact-form__submit" :disabled="submitting">
              <span v-if="submitting" class="contact-form__spinner" aria-hidden="true" />
              {{ submitting ? 'در حال ارسال…' : 'ارسال پیام' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { buildContentSeoHead } from '../features/content/content-seo';

useHead(buildContentSeoHead({ title: 'تماس با ما' }));

const site = usePublicSite();

const { data, pending, error } = await useAsyncData('site-contact', () => site.getSettings());

const contact = computed(() => data.value?.settings?.contact ?? null);

// ── Form state ──────────────────────────────────────────────────────────────
const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  website: '', // honeypot
});

const fieldErrors = reactive<{ name?: string; email?: string; message?: string }>({});
const submitting = ref(false);
const submitSuccess = ref(false);
const submitError = ref<string | null>(null);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(): boolean {
  fieldErrors.name = undefined;
  fieldErrors.email = undefined;
  fieldErrors.message = undefined;

  let valid = true;

  if (!form.name.trim()) {
    fieldErrors.name = 'لطفاً نام خود را وارد کنید.';
    valid = false;
  }

  if (!form.email.trim()) {
    fieldErrors.email = 'لطفاً ایمیل خود را وارد کنید.';
    valid = false;
  } else if (!EMAIL_RE.test(form.email.trim())) {
    fieldErrors.email = 'فرمت ایمیل صحیح نیست.';
    valid = false;
  }

  if (!form.message.trim()) {
    fieldErrors.message = 'لطفاً متن پیام را وارد کنید.';
    valid = false;
  }

  return valid;
}

async function handleSubmit() {
  submitError.value = null;

  if (!validate()) return;

  submitting.value = true;

  try {
    await site.submitContactMessage({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim() || undefined,
      message: form.message.trim(),
      website: form.website || undefined,
    });

    submitSuccess.value = true;
    form.name = '';
    form.email = '';
    form.subject = '';
    form.message = '';
    form.website = '';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('429')) {
      submitError.value = 'تعداد درخواست‌ها زیاد است، لطفاً بعداً تلاش کنید.';
    } else {
      submitError.value = 'ارسال پیام با خطا مواجه شد. لطفاً دوباره تلاش کنید.';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.contact-page {
  max-width: var(--layout-container-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.contact-inner {
  max-width: 760px;
  margin: 0 auto;
}

/* ── Header ── */
.contact-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--glass-hairline);
}

.contact-title {
  font-size: var(--text-h1-size);
  font-weight: var(--weight-bold);
  line-height: var(--text-h1-lh);
  margin: 0;
  color: var(--text-primary);
}

/* ── Contact info ── */
.contact-info {
  margin-bottom: 3rem;
}

.contact-info__list {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-info__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: var(--text-body-size);
}

.contact-info__label {
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  flex-shrink: 0;
}

.contact-info__link {
  color: var(--purple-300);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color var(--motion-fast) var(--ease-out);
}

.contact-info__link:hover {
  color: var(--purple-200);
}

.contact-info__text {
  color: var(--text-secondary);
}

.contact-info__item--socials {
  align-items: flex-start;
  flex-wrap: wrap;
}

.contact-info__socials {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.contact-info__social-link {
  color: var(--purple-300);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-size: var(--text-body-size);
  transition: color var(--motion-fast) var(--ease-out);
}

.contact-info__social-link:hover {
  color: var(--purple-200);
}

/* ── Map ── */
.contact-map {
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--glass-border);
  aspect-ratio: 16 / 7;
}

.contact-map__iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

/* ── Form section ── */
.contact-form-section {
  margin-top: 2rem;
}

.contact-form__heading {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin: 0 0 1.5rem;
}

/* Notices */
.form-notice {
  padding: 14px 18px;
  border-radius: var(--radius-md);
  font-size: var(--text-body-sm-size);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.form-notice--success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.form-notice--error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--danger-400);
}

/* Honeypot */
.contact-form__honeypot {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

/* Form layout */
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}

.contact-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.contact-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contact-form__label {
  font-size: 13px;
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.contact-form__required {
  color: var(--danger-400);
  margin-inline-start: 2px;
}

.contact-form__input,
.contact-form__textarea {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-border);
  background: var(--surface-elevated);
  color: var(--text-primary);
  font-size: var(--text-body-size);
  font-family: inherit;
  transition:
    border-color var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out);
  width: 100%;
  box-sizing: border-box;
  direction: rtl;
}

.contact-form__input:focus,
.contact-form__textarea:focus {
  outline: none;
  border-color: var(--purple-500);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.15);
}

.contact-form__input--error {
  border-color: var(--danger-400);
}

.contact-form__input--error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.contact-form__input:disabled,
.contact-form__textarea:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.contact-form__textarea {
  resize: vertical;
  min-height: 140px;
}

.contact-form__error {
  font-size: 12px;
  color: var(--danger-400);
}

/* Submit button */
.contact-form__actions {
  display: flex;
  justify-content: flex-start;
}

.contact-form__submit {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 24px;
  border-radius: var(--radius-sm);
  background: var(--brand-gradient);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  box-shadow:
    var(--glow-primary),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
  transition:
    box-shadow var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-spring),
    opacity var(--motion-fast);
}

.contact-form__submit:hover:not(:disabled) {
  box-shadow:
    var(--glow-primary-strong),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
}

.contact-form__submit:active:not(:disabled) {
  transform: translateY(0);
}

.contact-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner inside button */
.contact-form__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  animation: dr-spin 0.7s linear infinite;
}

/* ── Responsive ── */
@media (max-width: 600px) {
  .contact-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
