import { ref } from 'vue';
import type { AdminSystemHealthResponse } from '@dragon/sdk';
import * as systemApi from '~/features/system/admin-system.api';

const _health = ref<AdminSystemHealthResponse | null>(null);
const _loading = ref(false);
const _error = ref<string | null>(null);

export function useAdminSystem() {
  async function loadHealth() {
    _loading.value = true;
    _error.value = null;

    try {
      const client = useAdminApiClient();
      _health.value = await systemApi.getSystemHealth(client);
    } catch (err) {
      _error.value = err instanceof Error ? err.message : 'خطا در بارگذاری وضعیت سیستم.';
    } finally {
      _loading.value = false;
    }
  }

  return {
    health: _health,
    healthLoading: _loading,
    healthError: _error,
    loadHealth,
  };
}
