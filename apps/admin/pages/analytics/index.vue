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
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-block-end: 1.5rem;
  padding: 0.85rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
}

.filter-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
}

.date-input {
  padding: 0.4rem 0.65rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  font-size: 0.875rem;
  outline: none;
  background: #fff;
}

.date-input:focus {
  border-color: #3b82f6;
}

.filter-clear-btn {
  margin-inline-start: auto;
  padding: 0.4rem 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  font-size: 0.82rem;
  background: #fff;
  cursor: pointer;
  color: #374151;
  transition: background 0.15s;
}

.filter-clear-btn:hover {
  background: #f1f5f9;
}

.analytics-section {
  margin-block-end: 2rem;
}

.section-title {
  margin: 0 0 0.85rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.subsection-title {
  margin: 1rem 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
}

.metric-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.top-content-wrap {
  margin-block-start: 0.5rem;
}
</style>
