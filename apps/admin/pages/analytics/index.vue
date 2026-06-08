<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">آنالیتیکس</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.ANALYTICS_READ)" />

    <template v-else>
      <!-- Date range filter -->
      <div class="date-filter">
        <label class="filter-label" for="date-from">از تاریخ</label>
        <input
          id="date-from"
          v-model="dateFrom"
          class="date-input"
          type="date"
          @change="applyFilter"
        />
        <label class="filter-label" for="date-to">تا تاریخ</label>
        <input id="date-to" v-model="dateTo" class="date-input" type="date" @change="applyFilter" />
        <button class="filter-clear-btn" type="button" @click="clearFilter">پاکسازی فیلتر</button>
      </div>

      <!-- Auth section: registrations + logins -->
      <section class="analytics-section">
        <h2 class="section-title">احراز هویت</h2>
        <div v-if="authLoading" class="metric-row">
          <AnalyticsMetricCard label="ثبت‌نام" :loading="true" />
          <AnalyticsMetricCard label="ورود" :loading="true" />
        </div>
        <ErrorState
          v-else-if="authError"
          :message="authError"
          :on-retry="() => loadAuth(dateRangeParams)"
        />
        <div v-else class="metric-row">
          <AnalyticsMetricCard label="ثبت‌نام" :value="auth?.registrations ?? 0" />
          <AnalyticsMetricCard label="ورود موفق" :value="auth?.logins ?? 0" />
        </div>
      </section>

      <!-- OTP section -->
      <section class="analytics-section">
        <h2 class="section-title">کدهای یک‌بار مصرف (OTP)</h2>
        <div v-if="otpLoading" class="metric-row">
          <AnalyticsMetricCard label="درخواست‌شده" :loading="true" />
          <AnalyticsMetricCard label="تأییدشده" :loading="true" />
          <AnalyticsMetricCard label="ناموفق" :loading="true" />
        </div>
        <ErrorState
          v-else-if="otpError"
          :message="otpError"
          :on-retry="() => loadOtp(dateRangeParams)"
        />
        <div v-else class="metric-row">
          <AnalyticsMetricCard label="درخواست‌شده" :value="otp?.requested ?? 0" />
          <AnalyticsMetricCard label="تأییدشده" :value="otp?.verified ?? 0" />
          <AnalyticsMetricCard label="ناموفق" :value="otp?.failed ?? 0" />
        </div>
      </section>

      <!-- Content section: views + published + top table -->
      <section class="analytics-section">
        <h2 class="section-title">محتوا</h2>
        <div v-if="contentTopLoading" class="metric-row">
          <AnalyticsMetricCard label="بازدید" :loading="true" />
          <AnalyticsMetricCard label="منتشرشده" :loading="true" />
        </div>
        <template v-else-if="contentTopError">
          <ErrorState
            :message="contentTopError"
            :on-retry="() => loadContentTop(dateRangeParams)"
          />
        </template>
        <template v-else>
          <div class="metric-row">
            <AnalyticsMetricCard label="بازدید" :value="contentTop?.views ?? 0" />
            <AnalyticsMetricCard label="منتشرشده" :value="contentTop?.published ?? 0" />
          </div>
          <div v-if="contentTop" class="top-content-wrap">
            <h3 class="subsection-title">پربازدیدترین محتوا</h3>
            <AnalyticsTopContentTable :items="contentTop.top" />
          </div>
        </template>
      </section>

      <!-- Media section -->
      <section class="analytics-section">
        <h2 class="section-title">رسانه</h2>
        <div v-if="mediaLoading" class="metric-row">
          <AnalyticsMetricCard label="آپلودشده" :loading="true" />
        </div>
        <ErrorState
          v-else-if="mediaError"
          :message="mediaError"
          :on-retry="() => loadMedia(dateRangeParams)"
        />
        <div v-else class="metric-row">
          <AnalyticsMetricCard label="آپلودشده" :value="media?.uploads ?? 0" />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';
import type { AnalyticsDateRangeParams } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.ANALYTICS_READ,
});
useHead({ title: 'آنالیتیکس — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const {
  auth,
  authLoading,
  authError,
  otp,
  otpLoading,
  otpError,
  contentTop,
  contentTopLoading,
  contentTopError,
  media,
  mediaLoading,
  mediaError,
  loadAuth,
  loadOtp,
  loadContentTop,
  loadMedia,
  loadAll,
} = useAnalytics();

const dateFrom = ref('');
const dateTo = ref('');

const dateRangeParams = computed<AnalyticsDateRangeParams | undefined>(() => {
  if (!dateFrom.value && !dateTo.value) return undefined;
  return {
    ...(dateFrom.value ? { dateFrom: dateFrom.value } : {}),
    ...(dateTo.value ? { dateTo: dateTo.value } : {}),
  };
});

async function applyFilter() {
  await loadAll(dateRangeParams.value);
}

async function clearFilter() {
  dateFrom.value = '';
  dateTo.value = '';
  await loadAll(undefined);
}

onMounted(async () => {
  if (hasPermission(Permissions.ANALYTICS_READ)) {
    await loadAll(undefined);
  }
});
</script>

<style scoped>
.page {
  max-width: 960px;
}

.page-header {
  margin-block-end: 1.25rem;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-block-end: 24px;
  padding: 12px 16px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.date-input {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  font-size: 13px;
  outline: none;
  background: var(--input-bg);
  color: var(--text-primary);
  font-family: var(--font-mono);
  transition: border-color var(--motion-fast);
}

.date-input:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
}

.filter-clear-btn {
  margin-inline-start: auto;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  font-size: 12.5px;
  background: var(--hover-overlay);
  color: var(--text-secondary);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--motion-fast);
}

.filter-clear-btn:hover {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
}

.analytics-section {
  margin-block-end: 28px;
}

.section-title {
  margin: 0 0 14px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-sans-en);
}

.subsection-title {
  margin: 16px 0 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.metric-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.top-content-wrap {
  margin-block-start: 8px;
}
</style>
