import type { TournamentListParams, TournamentSearchParams } from '@dragon/sdk';
import type {
  TournamentListResponseDto,
  TournamentListItemDto,
  TournamentStatus,
  TournamentFormat,
} from '@dragon/types';
import {
  createTournamentsDiscoveryApi,
  createTournamentSearchApi,
} from '~/features/tournaments/tournaments-api';

const DEBOUNCE_MS = 350;

export interface TournamentsFilter {
  readonly q?: string;
  readonly gameId?: string;
  readonly status?: TournamentStatus;
  readonly format?: TournamentFormat;
  readonly registrationOpen?: boolean;
  readonly page?: number;
  readonly limit?: number;
}

export function usePublicTournaments() {
  const runtimeConfig = useRuntimeConfig();
  const baseUrl = runtimeConfig.public?.apiBaseUrl as string | undefined;

  const loading = ref(false);
  const error = ref<string | null>(null);
  const items = ref<readonly TournamentListItemDto[]>([]);
  const total = ref(0);
  const page = ref(1);
  const limit = ref(20);

  const tournamentsApi = createTournamentsDiscoveryApi({ baseUrl });
  const searchApi = createTournamentSearchApi({ baseUrl });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function fetch(filter: TournamentsFilter = {}) {
    loading.value = true;
    error.value = null;

    try {
      let res: TournamentListResponseDto;

      if (filter.q && filter.q.trim().length > 0) {
        const params: TournamentSearchParams = {
          q: filter.q.trim(),
          ...(filter.gameId !== undefined ? { gameId: filter.gameId } : {}),
          ...(filter.status !== undefined ? { status: filter.status } : {}),
          ...(filter.format !== undefined ? { format: filter.format } : {}),
          ...(filter.registrationOpen !== undefined
            ? { registrationOpen: filter.registrationOpen }
            : {}),
          ...(filter.page !== undefined ? { page: filter.page } : {}),
          ...(filter.limit !== undefined ? { limit: filter.limit } : {}),
        };
        res = await searchApi.tournaments(params);
      } else {
        const params: TournamentListParams = {
          ...(filter.gameId !== undefined ? { gameId: filter.gameId } : {}),
          ...(filter.status !== undefined ? { status: filter.status } : {}),
          ...(filter.format !== undefined ? { format: filter.format } : {}),
          ...(filter.registrationOpen !== undefined
            ? { registrationOpen: filter.registrationOpen }
            : {}),
          ...(filter.page !== undefined ? { page: filter.page } : {}),
          ...(filter.limit !== undefined ? { limit: filter.limit } : {}),
        };
        res = await tournamentsApi.list(params);
      }

      items.value = res.items;
      total.value = res.total;
      page.value = res.page;
      limit.value = res.limit;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'خطا در بارگذاری تورنمنت‌ها. لطفاً دوباره تلاش کنید.';
      items.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  }

  function debounceFetch(filter: TournamentsFilter) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void fetch(filter);
    }, DEBOUNCE_MS);
  }

  return { loading, error, items, total, page, limit, fetch, debounceFetch };
}
