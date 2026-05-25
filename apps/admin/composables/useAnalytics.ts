import { ref } from 'vue';
import type { AnalyticsDateRangeParams } from '@dragon/sdk';
import type {
  AnalyticsAuthSummaryDto,
  AnalyticsContentSummaryDto,
  AnalyticsMediaSummaryDto,
  AnalyticsOtpSummaryDto,
  AnalyticsSummaryDto,
} from '@dragon/types';
import * as analyticsApi from '~/features/analytics/admin-analytics.api';

// ─── Summary state ────────────────────────────────────────────────────────────

const _summary = ref<AnalyticsSummaryDto | null>(null);
const _summaryLoading = ref(false);
const _summaryError = ref<string | null>(null);

// ─── Auth state ───────────────────────────────────────────────────────────────

const _auth = ref<AnalyticsAuthSummaryDto | null>(null);
const _authLoading = ref(false);
const _authError = ref<string | null>(null);

// ─── OTP state ────────────────────────────────────────────────────────────────

const _otp = ref<AnalyticsOtpSummaryDto | null>(null);
const _otpLoading = ref(false);
const _otpError = ref<string | null>(null);

// ─── Content top state ────────────────────────────────────────────────────────

const _contentTop = ref<AnalyticsContentSummaryDto | null>(null);
const _contentTopLoading = ref(false);
const _contentTopError = ref<string | null>(null);

// ─── Media state ──────────────────────────────────────────────────────────────

const _media = ref<AnalyticsMediaSummaryDto | null>(null);
const _mediaLoading = ref(false);
const _mediaError = ref<string | null>(null);

export function useAnalytics() {
  async function loadSummary(params?: AnalyticsDateRangeParams) {
    _summaryLoading.value = true;
    _summaryError.value = null;
    try {
      _summary.value = await analyticsApi.getAnalyticsSummary(useAdminApiClient(), params);
    } catch (err) {
      _summaryError.value = err instanceof Error ? err.message : 'خطا در بارگذاری خلاصه آمار.';
    } finally {
      _summaryLoading.value = false;
    }
  }

  async function loadAuth(params?: AnalyticsDateRangeParams) {
    _authLoading.value = true;
    _authError.value = null;
    try {
      _auth.value = await analyticsApi.getAnalyticsAuth(useAdminApiClient(), params);
    } catch (err) {
      _authError.value = err instanceof Error ? err.message : 'خطا در بارگذاری آمار احراز هویت.';
    } finally {
      _authLoading.value = false;
    }
  }

  async function loadOtp(params?: AnalyticsDateRangeParams) {
    _otpLoading.value = true;
    _otpError.value = null;
    try {
      _otp.value = await analyticsApi.getAnalyticsOtp(useAdminApiClient(), params);
    } catch (err) {
      _otpError.value = err instanceof Error ? err.message : 'خطا در بارگذاری آمار OTP.';
    } finally {
      _otpLoading.value = false;
    }
  }

  async function loadContentTop(params?: AnalyticsDateRangeParams) {
    _contentTopLoading.value = true;
    _contentTopError.value = null;
    try {
      _contentTop.value = await analyticsApi.getAnalyticsContentTop(useAdminApiClient(), params);
    } catch (err) {
      _contentTopError.value = err instanceof Error ? err.message : 'خطا در بارگذاری آمار محتوا.';
    } finally {
      _contentTopLoading.value = false;
    }
  }

  async function loadMedia(params?: AnalyticsDateRangeParams) {
    _mediaLoading.value = true;
    _mediaError.value = null;
    try {
      _media.value = await analyticsApi.getAnalyticsMedia(useAdminApiClient(), params);
    } catch (err) {
      _mediaError.value = err instanceof Error ? err.message : 'خطا در بارگذاری آمار رسانه.';
    } finally {
      _mediaLoading.value = false;
    }
  }

  async function loadAll(params?: AnalyticsDateRangeParams) {
    await Promise.allSettled([
      loadAuth(params),
      loadOtp(params),
      loadContentTop(params),
      loadMedia(params),
    ]);
  }

  return {
    summary: _summary,
    summaryLoading: _summaryLoading,
    summaryError: _summaryError,

    auth: _auth,
    authLoading: _authLoading,
    authError: _authError,

    otp: _otp,
    otpLoading: _otpLoading,
    otpError: _otpError,

    contentTop: _contentTop,
    contentTopLoading: _contentTopLoading,
    contentTopError: _contentTopError,

    media: _media,
    mediaLoading: _mediaLoading,
    mediaError: _mediaError,

    loadSummary,
    loadAuth,
    loadOtp,
    loadContentTop,
    loadMedia,
    loadAll,
  };
}
