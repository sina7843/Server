import { ref } from 'vue';
import { createSystemHealthClient } from '@dragon/sdk';
import type { HealthDependenciesDto } from '@dragon/sdk';

const _dependencies = ref<HealthDependenciesDto | null>(null);
const _loading = ref(false);
const _error = ref<string | null>(null);

export function useSystemHealth() {
  async function loadDependencies() {
    _loading.value = true;
    _error.value = null;

    try {
      const client = useAdminApiClient();
      _dependencies.value = await createSystemHealthClient(client).getDependencies();
    } catch (err) {
      _error.value = err instanceof Error ? err.message : 'خطا در بارگذاری وضعیت سرویس‌ها.';
    } finally {
      _loading.value = false;
    }
  }

  return {
    dependencies: _dependencies,
    dependenciesLoading: _loading,
    dependenciesError: _error,
    loadDependencies,
  };
}
