<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">تنظیمات سایت</h1>
    </div>

    <LoadingState v-if="pageLoading" />

    <ErrorState v-else-if="pageError" :message="pageError" />

    <template v-else>
      <form class="form" @submit.prevent="onSubmit">
        <!-- About Section -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">درباره ما</legend>

          <div class="field">
            <label for="about-title" class="field-label">عنوان <span class="required">*</span></label>
            <input
              id="about-title"
              v-model="form.about.title"
              class="field-input"
              type="text"
              maxlength="500"
              required
              placeholder="عنوان بخش درباره ما"
            />
          </div>

          <div class="field">
            <label class="field-label">متن</label>
            <ClientOnly>
              <ContentRichTextEditor v-model="form.about.bodyJson" @html="form.about.bodyHtml = $event" />
              <template #fallback>
                <textarea
                  v-model="form.about.bodyHtml"
                  class="field-textarea field-textarea--body"
                  rows="12"
                  placeholder="متن بخش درباره ما را اینجا وارد کنید…"
                />
              </template>
            </ClientOnly>
          </div>
        </fieldset>

        <!-- Contact Section -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">اطلاعات تماس</legend>

          <div class="field">
            <label for="contact-email" class="field-label">
              ایمیل <span class="field-hint">(اختیاری)</span>
            </label>
            <input
              id="contact-email"
              v-model="form.contact.email"
              class="field-input"
              type="text"
              maxlength="255"
              placeholder="info@example.com"
            />
          </div>

          <div class="field">
            <label for="contact-phone" class="field-label">
              تلفن <span class="field-hint">(اختیاری)</span>
            </label>
            <input
              id="contact-phone"
              v-model="form.contact.phone"
              class="field-input"
              type="text"
              maxlength="50"
              placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
            />
          </div>

          <div class="field">
            <label for="contact-address" class="field-label">
              آدرس <span class="field-hint">(اختیاری)</span>
            </label>
            <input
              id="contact-address"
              v-model="form.contact.address"
              class="field-input"
              type="text"
              maxlength="500"
              placeholder="تهران، خیابان …"
            />
          </div>

          <div class="field">
            <label for="contact-map" class="field-label">
              لینک نقشه (Embed URL) <span class="field-hint">(اختیاری)</span>
            </label>
            <input
              id="contact-map"
              v-model="form.contact.mapEmbedUrl"
              class="field-input"
              type="text"
              maxlength="1000"
              placeholder="https://www.google.com/maps/embed?…"
            />
          </div>

          <!-- Socials -->
          <div class="field">
            <label class="field-label">شبکه‌های اجتماعی</label>

            <div class="socials-list">
              <div
                v-for="(social, index) in form.contact.socials"
                :key="index"
                class="social-row"
              >
                <input
                  v-model="social.platform"
                  class="field-input social-platform"
                  type="text"
                  maxlength="50"
                  placeholder="پلتفرم (مثال: instagram)"
                />
                <input
                  v-model="social.url"
                  class="field-input social-url"
                  type="text"
                  maxlength="500"
                  placeholder="https://instagram.com/…"
                />
                <button
                  type="button"
                  class="remove-btn"
                  :aria-label="`حذف شبکه اجتماعی ${index + 1}`"
                  @click="removeSocial(index)"
                >
                  ✕
                </button>
              </div>
            </div>

            <button type="button" class="add-social-btn" @click="addSocial">
              + افزودن شبکه اجتماعی
            </button>
          </div>
        </fieldset>

        <div v-if="actionError" class="form-error" role="alert">{{ actionError }}</div>
        <div v-if="actionSuccess" class="form-success" role="status">{{ actionSuccess }}</div>

        <div class="form-actions">
          <button class="submit-btn" type="submit" :disabled="actionLoading">
            <span v-if="actionLoading" class="btn-spinner" aria-hidden="true" />
            ذخیره تنظیمات
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';
import { getSiteSettings, updateSiteSettings } from '~/features/site/admin-site.api';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.SITE_SETTINGS_UPDATE,
});
useHead({ title: 'تنظیمات سایت — Dragon Admin' });

const client = useAdminApiClient();

const pageLoading = ref(false);
const pageError = ref('');
const actionLoading = ref(false);
const actionError = ref('');
const actionSuccess = ref('');

const form = reactive({
  about: {
    title: '',
    bodyJson: {} as Record<string, unknown>,
    bodyHtml: '',
  },
  contact: {
    email: '',
    phone: '',
    address: '',
    mapEmbedUrl: '',
    socials: [] as { platform: string; url: string }[],
  },
});

function addSocial() {
  form.contact.socials.push({ platform: '', url: '' });
}

function removeSocial(index: number) {
  form.contact.socials.splice(index, 1);
}

async function onSubmit() {
  actionError.value = '';
  actionSuccess.value = '';
  actionLoading.value = true;

  try {
    const contact = {
      ...(form.contact.email ? { email: form.contact.email } : {}),
      ...(form.contact.phone ? { phone: form.contact.phone } : {}),
      ...(form.contact.address ? { address: form.contact.address } : {}),
      ...(form.contact.mapEmbedUrl ? { mapEmbedUrl: form.contact.mapEmbedUrl } : {}),
      socials: form.contact.socials.map((s) => ({ platform: s.platform, url: s.url })),
    };

    await updateSiteSettings(client, {
      about: {
        title: form.about.title,
        bodyJson: form.about.bodyJson,
        bodyHtml: form.about.bodyHtml,
      },
      contact,
    });
    actionSuccess.value = 'تنظیمات با موفقیت ذخیره شد.';
  } catch (err: unknown) {
    if (err instanceof Error) {
      actionError.value = err.message || 'خطایی رخ داده است.';
    } else {
      actionError.value = 'خطایی رخ داده است.';
    }
  } finally {
    actionLoading.value = false;
  }
}

onMounted(async () => {
  pageLoading.value = true;
  pageError.value = '';
  try {
    const res = await getSiteSettings(client);
    const s = res.settings;
    form.about.title = s.about?.title ?? '';
    form.about.bodyJson = s.about?.bodyJson ?? {};
    form.about.bodyHtml = s.about?.bodyHtml ?? '';
    form.contact.email = s.contact?.email ?? '';
    form.contact.phone = s.contact?.phone ?? '';
    form.contact.address = s.contact?.address ?? '';
    form.contact.mapEmbedUrl = s.contact?.mapEmbedUrl ?? '';
    form.contact.socials = (s.contact?.socials ?? []).map((soc) => ({
      platform: soc.platform,
      url: soc.url,
    }));
  } catch (err: unknown) {
    if (err instanceof Error) {
      pageError.value = err.message || 'بارگذاری تنظیمات با خطا مواجه شد.';
    } else {
      pageError.value = 'بارگذاری تنظیمات با خطا مواجه شد.';
    }
  } finally {
    pageLoading.value = false;
  }
});
</script>

<style scoped>
.page {
  max-width: 760px;
}
.page-header {
  margin-block-end: 1.25rem;
}
.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

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
.required {
  color: #ef4444;
  margin-inline-start: 0.1rem;
}

.field-input,
.field-textarea {
  padding: 0.5rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}
.field-input:focus,
.field-textarea:focus {
  border-color: #3b82f6;
}
.field-textarea {
  resize: vertical;
}
.field-textarea--body {
  font-family: monospace;
  font-size: 0.85rem;
  min-height: 200px;
}

.fieldset {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.fieldset-legend {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  padding-inline: 0.4rem;
}

/* Socials */
.socials-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-block-end: 0.5rem;
}
.social-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.social-platform {
  flex: 0 0 160px;
}
.social-url {
  flex: 1;
}
.remove-btn {
  padding: 0.35rem 0.6rem;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  cursor: pointer;
  line-height: 1;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.remove-btn:hover {
  opacity: 0.8;
}
.add-social-btn {
  align-self: flex-start;
  padding: 0.35rem 0.85rem;
  background: #f1f5f9;
  color: #374151;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.add-social-btn:hover {
  background: #e2e8f0;
}

.form-error {
  font-size: 0.85rem;
  color: #dc2626;
  background: #fee2e2;
  padding: 0.5rem 0.85rem;
  border-radius: 0.4rem;
}
.form-success {
  font-size: 0.85rem;
  color: #166534;
  background: #dcfce7;
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
</style>
