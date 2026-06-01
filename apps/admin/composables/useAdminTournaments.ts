import { ref } from 'vue';
import type { TournamentListParams } from '@dragon/sdk';
import type { AdminTournamentDto, TournamentListResponseDto, GameDto } from '@dragon/types';
import type {
  CreateTournamentInput,
  UpdateTournamentInput,
} from '~/features/tournaments/admin-tournaments.api';
import * as tournamentsApi from '~/features/tournaments/admin-tournaments.api';

// ─── Tournaments list ─────────────────────────────────────────────────────────

const _tournaments = ref<readonly AdminTournamentDto[]>([]);
const _tournamentsTotal = ref(0);
const _tournamentsPage = ref(1);
const _tournamentsLimit = ref(20);
const _tournamentsLoading = ref(false);
const _tournamentsError = ref<string | null>(null);

// ─── Single tournament ────────────────────────────────────────────────────────

const _tournament = ref<AdminTournamentDto | null>(null);
const _tournamentLoading = ref(false);
const _tournamentError = ref<string | null>(null);

// ─── Action state ─────────────────────────────────────────────────────────────

const _actionLoading = ref(false);
const _actionError = ref<string | null>(null);
const _actionSuccess = ref<string | null>(null);

// ─── Games for selector ───────────────────────────────────────────────────────

const _gamesForSelector = ref<readonly GameDto[]>([]);
const _gamesForSelectorLoading = ref(false);

export function useAdminTournaments() {
  async function loadTournaments(params?: TournamentListParams) {
    _tournamentsLoading.value = true;
    _tournamentsError.value = null;

    try {
      const res: TournamentListResponseDto = await tournamentsApi.listTournaments(
        useAdminApiClient(),
        params,
      );
      _tournaments.value = res.items as AdminTournamentDto[];
      _tournamentsTotal.value = res.total;
      _tournamentsPage.value = res.page;
      _tournamentsLimit.value = res.limit;
    } catch (err) {
      _tournamentsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری تورنمنت‌ها.';
    } finally {
      _tournamentsLoading.value = false;
    }
  }

  async function loadTournament(id: string) {
    _tournament.value = null;
    _tournamentLoading.value = true;
    _tournamentError.value = null;

    try {
      _tournament.value = await tournamentsApi.getTournament(useAdminApiClient(), id);
    } catch (err) {
      _tournamentError.value = err instanceof Error ? err.message : 'خطا در بارگذاری تورنمنت.';
    } finally {
      _tournamentLoading.value = false;
    }
  }

  async function createTournament(
    input: CreateTournamentInput,
  ): Promise<AdminTournamentDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const created = await tournamentsApi.createTournament(useAdminApiClient(), input);
      _actionSuccess.value = 'تورنمنت با موفقیت ایجاد شد.';
      return created;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ایجاد تورنمنت.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function updateTournament(
    id: string,
    input: UpdateTournamentInput,
  ): Promise<AdminTournamentDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await tournamentsApi.updateTournament(useAdminApiClient(), id, input);
      _tournament.value = updated;
      _tournaments.value = _tournaments.value.map((t) =>
        t.id === id ? (updated as AdminTournamentDto) : t,
      );
      _actionSuccess.value = 'تغییرات ذخیره شد.';
      return updated;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ویرایش تورنمنت.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function publishTournament(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await tournamentsApi.publishTournament(useAdminApiClient(), id);
      _tournament.value = updated;
      _actionSuccess.value = 'تورنمنت منتشر شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در انتشار تورنمنت.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function openRegistration(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await tournamentsApi.openRegistration(useAdminApiClient(), id);
      _tournament.value = updated;
      _actionSuccess.value = 'ثبت‌نام باز شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در باز کردن ثبت‌نام.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function closeRegistration(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await tournamentsApi.closeRegistration(useAdminApiClient(), id);
      _tournament.value = updated;
      _actionSuccess.value = 'ثبت‌نام بسته شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در بستن ثبت‌نام.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function startTournament(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await tournamentsApi.startTournament(useAdminApiClient(), id);
      _tournament.value = updated;
      _actionSuccess.value = 'تورنمنت شروع شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در شروع تورنمنت.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function completeTournament(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await tournamentsApi.completeTournament(useAdminApiClient(), id);
      _tournament.value = updated;
      _actionSuccess.value = 'تورنمنت پایان یافت.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در پایان دادن به تورنمنت.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function cancelTournament(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await tournamentsApi.cancelTournament(useAdminApiClient(), id);
      _tournament.value = updated;
      _actionSuccess.value = 'تورنمنت لغو شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در لغو تورنمنت.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function archiveTournament(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await tournamentsApi.archiveTournament(useAdminApiClient(), id);
      _tournament.value = updated;
      _actionSuccess.value = 'تورنمنت بایگانی شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در بایگانی تورنمنت.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function deleteTournament(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      await tournamentsApi.deleteTournament(useAdminApiClient(), id);
      _tournaments.value = _tournaments.value.filter((t) => t.id !== id);
      if (_tournament.value?.id === id) _tournament.value = null;
      _actionSuccess.value = 'تورنمنت حذف شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در حذف تورنمنت.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function loadGamesForSelector() {
    _gamesForSelectorLoading.value = true;

    try {
      const res = await tournamentsApi.listGamesForSelector(useAdminApiClient());
      _gamesForSelector.value = res.items;
    } catch {
      // silent — game selector degrades gracefully
    } finally {
      _gamesForSelectorLoading.value = false;
    }
  }

  function clearActionState() {
    _actionLoading.value = false;
    _actionError.value = null;
    _actionSuccess.value = null;
  }

  return {
    // List
    tournaments: _tournaments,
    tournamentsTotal: _tournamentsTotal,
    tournamentsPage: _tournamentsPage,
    tournamentsLimit: _tournamentsLimit,
    tournamentsLoading: _tournamentsLoading,
    tournamentsError: _tournamentsError,
    loadTournaments,

    // Single tournament
    tournament: _tournament,
    tournamentLoading: _tournamentLoading,
    tournamentError: _tournamentError,
    loadTournament,

    // Actions
    createTournament,
    updateTournament,
    publishTournament,
    openRegistration,
    closeRegistration,
    startTournament,
    completeTournament,
    cancelTournament,
    archiveTournament,
    deleteTournament,

    // Action state
    actionLoading: _actionLoading,
    actionError: _actionError,
    actionSuccess: _actionSuccess,
    clearActionState,

    // Games selector
    gamesForSelector: _gamesForSelector,
    gamesForSelectorLoading: _gamesForSelectorLoading,
    loadGamesForSelector,
  };
}
