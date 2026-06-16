<template>
  <main class="contact-page">
    <div class="contact-shell">
      <!-- Page header -->
      <header class="contact-head">
        <h1 class="contact-head__title">
          تماس <span class="contact-head__accent">با ما</span>
        </h1>
        <p class="contact-head__lead">
          سوال، پیشنهاد یا همکاری؟ پیام بده؛ تیم ما در سریع‌ترین زمان ممکن پاسخ می‌دهد.
        </p>
      </header>

      <ContentStateMessage v-if="pending" state="loading" />
      <ContentStateMessage v-else-if="error" state="error" />

      <template v-else>
        <div class="contact-grid">
          <!-- Left: contact info -->
          <section class="contact-info" aria-label="راه‌های ارتباطی">
            <h2 class="contact-info__heading">راه‌های ارتباطی</h2>

            <ul v-if="hasChannels" class="channels">
              <li v-if="contact?.email" class="channel">
                <span class="channel__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                    <rect x="3" y="5" width="18" height="14" rx="2.5" />
                    <path d="m3.5 7 8.5 6 8.5-6" stroke-linecap="round" />
                  </svg>
                </span>
                <span class="channel__body">
                  <span class="channel__label">ایمیل</span>
                  <a :href="`mailto:${contact.email}`" class="channel__value" dir="ltr">{{ contact.email }}</a>
                </span>
              </li>

              <li v-if="contact?.phone" class="channel">
                <span class="channel__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" stroke-linejoin="round" />
                  </svg>
                </span>
                <span class="channel__body">
                  <span class="channel__label">تلفن</span>
                  <a :href="`tel:${contact.phone}`" class="channel__value" dir="ltr">{{ contact.phone }}</a>
                </span>
              </li>

              <li v-if="contact?.address" class="channel">
                <span class="channel__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke-linejoin="round" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <span class="channel__body">
                  <span class="channel__label">آدرس</span>
                  <span class="channel__value">{{ contact.address }}</span>
                </span>
              </li>
            </ul>

            <div v-if="contact?.socials?.length" class="socials">
              <span class="socials__label">ما را دنبال کنید</span>
              <div class="socials__row">
                <a
                  v-for="social in contact.socials"
                  :key="social.platform"
                  :href="social.url"
                  class="social-pill"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{{ social.platform }}</span>
                  <svg class="social-pill__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path d="M7 17 17 7M9 7h8v8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          </section>

          <!-- Right: form card -->
          <section class="form-card" aria-label="فرم تماس">
            <transition name="fade">
              <div v-if="submitSuccess" class="success-state">
                <span class="success-state__check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m5 12.5 4.5 4.5L19 7" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <h3 class="success-state__title">پیام شما ارسال شد</h3>
                <p class="success-state__text">ممنون از پیام شما. به‌زودی پاسخ می‌دهیم.</p>
                <button type="button" class="ghost-btn" @click="resetForm">ارسال پیام دیگر</button>
              </div>

              <form v-else class="form" novalidate @submit.prevent="handleSubmit">
                <h2 class="form__heading">ارسال پیام</h2>

                <div v-if="submitError" class="form-banner form-banner--error" role="alert">
                  {{ submitError }}
                </div>

                <!-- honeypot -->
                <div class="honeypot" aria-hidden="true">
                  <label>وب‌سایت<input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" /></label>
                </div>

                <div class="form__row">
                  <div class="field">
                    <label for="c-name" class="field__label">نام<span class="field__req" aria-hidden="true">*</span></label>
                    <input
                      id="c-name"
                      v-model="form.name"
                      type="text"
                      class="field__input"
                      :class="{ 'field__input--err': fieldErrors.name }"
                      autocomplete="name"
                      :disabled="submitting"
                    />
                    <span v-if="fieldErrors.name" class="field__err" role="alert">{{ fieldErrors.name }}</span>
                  </div>

                  <div class="field">
                    <label for="c-email" class="field__label">ایمیل<span class="field__req" aria-hidden="true">*</span></label>
                    <input
                      id="c-email"
                      v-model="form.email"
                      type="email"
                      class="field__input"
                      :class="{ 'field__input--err': fieldErrors.email }"
                      autocomplete="email"
                      dir="ltr"
                      :disabled="submitting"
                    />
                    <span v-if="fieldErrors.email" class="field__err" role="alert">{{ fieldErrors.email }}</span>
                  </div>
                </div>

                <div class="field">
                  <label for="c-subject" class="field__label">موضوع</label>
                  <input
                    id="c-subject"
                    v-model="form.subject"
                    type="text"
                    class="field__input"
                    autocomplete="off"
                    :disabled="submitting"
                  />
                </div>

                <div class="field">
                  <label for="c-message" class="field__label">پیام<span class="field__req" aria-hidden="true">*</span></label>
                  <textarea
                    id="c-message"
                    v-model="form.message"
                    class="field__input field__textarea"
                    :class="{ 'field__input--err': fieldErrors.message }"
                    rows="6"
                    :disabled="submitting"
                  />
                  <span v-if="fieldErrors.message" class="field__err" role="alert">{{ fieldErrors.message }}</span>
                </div>

                <button type="submit" class="submit-btn" :disabled="submitting">
                  <span v-if="submitting" class="submit-btn__spinner" aria-hidden="true" />
                  <svg v-else class="submit-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path d="M5 12 20 5l-5 15-3.5-6.5L5 12Z" stroke-linejoin="round" />
                  </svg>
                  {{ submitting ? 'در حال ارسال…' : 'ارسال پیام' }}
                </button>
              </form>
            </transition>
          </section>
        </div>

        <!-- Full-width map -->
        <section v-if="contact?.mapEmbedUrl" class="map" aria-label="موقعیت روی نقشه">
          <iframe
            :src="contact.mapEmbedUrl"
            class="map__frame"
            title="موقعیت روی نقشه"
            loading="lazy"
            allowfullscreen
          />
        </section>
      </template>
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
const hasChannels = computed(
  () => !!(contact.value?.email || contact.value?.phone || contact.value?.address),
);

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

function resetForm() {
  submitSuccess.value = false;
  submitError.value = null;
  form.name = '';
  form.email = '';
  form.subject = '';
  form.message = '';
  form.website = '';
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    submitError.value = msg.includes('429')
      ? 'تعداد درخواست‌ها زیاد است، لطفاً کمی بعد دوباره تلاش کنید.'
      : 'ارسال پیام با خطا مواجه شد. لطفاً دوباره تلاش کنید.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.contact-page {
  max-width: var(--layout-container-max);
  margin: 0 auto;
  padding: 56px 24px 96px;
}

.contact-shell {
  max-width: 1080px;
  margin: 0 auto;
}

/* ── Header ── */
.contact-head {
  max-width: 640px;
  margin-bottom: 40px;
}

.contact-head__title {
  font-size: clamp(34px, 6vw, 52px);
  font-weight: var(--weight-bold);
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0 0 14px;
  color: var(--text-primary);
}

.contact-head__accent {
  background: var(--brand-gradient-text, var(--brand-gradient));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.contact-head__lead {
  font-size: var(--text-body-lg-size, 18px);
  line-height: 1.7;
  color: var(--text-secondary);
  margin: 0;
}

/* ── Grid ── */
.contact-grid {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 28px;
  align-items: start;
}

/* ── Info column ── */
.contact-info {
  padding: 4px;
}

.contact-info__heading {
  font-size: var(--text-h3-size, 20px);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0 0 22px;
}

.channels {
  list-style: none;
  margin: 0 0 32px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.channel {
  display: flex;
  align-items: center;
  gap: 14px;
}

.channel__icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--purple-300);
  background: var(--surface-glass);
  border: 1px solid var(--glass-border);
}

.channel__icon svg {
  width: 21px;
  height: 21px;
}

.channel__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.channel__label {
  font-size: var(--text-caption-size, 12px);
  color: var(--text-muted);
}

.channel__value {
  font-size: var(--text-body-size);
  color: var(--text-primary);
  text-decoration: none;
  word-break: break-word;
  transition: color var(--motion-fast) var(--ease-out);
}

a.channel__value:hover {
  color: var(--purple-300);
}

.socials__label {
  display: block;
  font-size: var(--text-caption-size, 12px);
  color: var(--text-muted);
  margin-bottom: 12px;
}

.socials__row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.social-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  background: var(--surface-glass);
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  font-size: var(--text-body-sm-size, 14px);
  text-decoration: none;
  transition:
    border-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-spring);
}

.social-pill:hover {
  color: var(--text-primary);
  border-color: var(--purple-500);
  transform: translateY(-2px);
}

.social-pill__arrow {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

/* ── Form card ── */
.form-card {
  position: relative;
  border-radius: var(--radius-xl);
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  box-shadow:
    inset 0 1px 0 var(--glass-inset-highlight),
    0 24px 60px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  padding: 32px;
  overflow: hidden;
}

.form-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(150deg, rgba(139, 92, 246, 0.5), transparent 40%);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.form__heading {
  font-size: var(--text-h3-size, 20px);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0 0 22px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field__label {
  font-size: var(--text-body-sm-size, 13px);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.field__req {
  color: var(--purple-400);
  margin-inline-start: 3px;
}

.field__input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  background: var(--surface-page);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-body-size);
  transition:
    border-color var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out);
}

.field__input::placeholder {
  color: var(--text-muted);
}

.field__input:focus {
  outline: none;
  border-color: var(--purple-500);
  box-shadow: 0 0 0 3px var(--brand-glow);
}

.field__textarea {
  resize: vertical;
  min-height: 140px;
  line-height: 1.7;
}

.field__input--err {
  border-color: var(--danger-500);
}

.field__input--err:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18);
}

.field__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.field__err {
  font-size: 12px;
  color: var(--danger-400);
}

.form-banner {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: var(--text-body-sm-size, 14px);
  line-height: 1.6;
}

.form-banner--error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--danger-400);
}

/* ── Submit ── */
.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 4px;
  height: 48px;
  padding: 0 28px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--brand-gradient);
  color: #fff;
  font-family: inherit;
  font-size: 15px;
  font-weight: var(--weight-semibold);
  cursor: pointer;
  box-shadow:
    0 8px 24px var(--brand-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition:
    transform var(--motion-fast) var(--ease-spring),
    box-shadow var(--motion-fast) var(--ease-out),
    opacity var(--motion-fast) var(--ease-out);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 12px 32px var(--brand-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.submit-btn__icon {
  width: 18px;
  height: 18px;
}

.submit-btn__spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  animation: dr-spin 0.7s linear infinite;
}

/* ── Success state ── */
.success-state {
  text-align: center;
  padding: 24px 8px;
}

.success-state__check {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  margin: 0 auto 18px;
  border-radius: 50%;
  color: #fff;
  background: var(--brand-gradient);
  box-shadow: 0 8px 24px var(--brand-glow);
}

.success-state__check svg {
  width: 28px;
  height: 28px;
}

.success-state__title {
  font-size: var(--text-h3-size, 20px);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0 0 8px;
}

.success-state__text {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  margin: 0 0 22px;
  line-height: 1.7;
}

.ghost-btn {
  height: 42px;
  padding: 0 22px;
  border-radius: var(--radius-pill);
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition:
    border-color var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-spring);
}

.ghost-btn:hover {
  border-color: var(--purple-500);
  transform: translateY(-1px);
}

/* ── Map ── */
.map {
  margin-top: 28px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--glass-border);
  box-shadow: inset 0 1px 0 var(--glass-inset-highlight);
  aspect-ratio: 21 / 7;
}

.map__frame {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  filter: grayscale(0.2);
}

/* ── Transition ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--motion-base) var(--ease-out);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 880px) {
  .contact-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .map {
    aspect-ratio: 16 / 10;
  }
}

@media (max-width: 540px) {
  .contact-page {
    padding: 40px 16px 72px;
  }
  .form-card {
    padding: 22px;
  }
  .form__row {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .social-pill,
  .submit-btn,
  .ghost-btn {
    transition: none;
  }
  .social-pill:hover,
  .submit-btn:hover:not(:disabled),
  .ghost-btn:hover {
    transform: none;
  }
  .submit-btn__spinner {
    animation: none;
  }
}
</style>
