import type { SearchContentParams } from '@dragon/sdk';
import type { SearchResultItemDto } from '@dragon/types';
import { createSearchApi } from '~/features/search/search-api';

const DEBOUNCE_MS = 350;

export function usePublicSearch() {
  const runtimeConfig = useRuntimeConfig();

  const loading = ref(false);
  const error = ref<string | null>(null);
  const items = ref<readonly SearchResultItemDto[]>([]);
  const total = ref(0);
  const page = ref(1);
  const limit = ref(20);

  const api = createSearchApi({
    baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
  });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function search(params: SearchContentParams = {}) {
    loading.value = true;
    error.value = null;

    try {
      const res = await api.searchContent(params);
      items.value = res.items;
      total.value = res.total;
      page.value = res.page;
      limit.value = res.limit;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'خطا در جستجو. لطفاً دوباره تلاش کنید.';
      items.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  }

  function debounceSearch(params: SearchContentParams) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void search(params);
    }, DEBOUNCE_MS);
  }

  return { loading, error, items, total, page, limit, search, debounceSearch };
}
