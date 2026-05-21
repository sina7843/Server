import { ref } from 'vue';
import type { AdminDashboardSummaryResponse } from '@dragon/sdk';
import * as dashboardApi from '~/features/dashboard/admin-dashboard.api';

const _summary = ref<AdminDashboardSummaryResponse | null>(null);
const _loading = ref(false);
const _error = ref<string | null>(null);

export function useAdminDashboard() {
  async function loadSummary() {
    _loading.value = true;
    _error.value = null;

    try {
      _summary.value = await dashboardApi.getDashboardSummary();
    } catch (err) {
      _error.value = err instanceof Error ? err.message : 'خطا در بارگذاری داشبورد.';
    } finally {
      _loading.value = false;
    }
  }

  return {
    summary: _summary,
    summaryLoading: _loading,
    summaryError: _error,
    loadSummary,
  };
}
