import { ref } from 'vue';
import type { AdminTournamentMatchDto, TournamentMatchStatus } from '@dragon/types';
import type { AdminTournamentMatchListResponseDto } from '@dragon/sdk';
import type {
  CreateTournamentMatchDto,
  UpdateTournamentMatchDto,
} from '~/features/tournaments/admin-tournament-matches.api';
import * as matchesApi from '~/features/tournaments/admin-tournament-matches.api';

// ─── List state ───────────────────────────────────────────────────────────────

const _matches = ref<readonly AdminTournamentMatchDto[]>([]);
const _matchesTotal = ref(0);
const _matchesPage = ref(1);
const _matchesLimit = ref(100);
const _matchesLoading = ref(false);
const _matchesError = ref<string | null>(null);

// ─── Action state ─────────────────────────────────────────────────────────────

const _actionLoading = ref(false);
const _actionError = ref<string | null>(null);
const _actionSuccess = ref<string | null>(null);

export function useAdminTournamentMatches() {
  async function loadMatches(
    tournamentId: string,
    params?: { round?: number; status?: TournamentMatchStatus; page?: number; limit?: number },
  ) {
    _matchesLoading.value = true;
    _matchesError.value = null;

    try {
      const res: AdminTournamentMatchListResponseDto = await matchesApi.listMatches(
        useAdminApiClient(),
        tournamentId,
        params,
      );
      _matches.value = res.items;
      _matchesTotal.value = res.total;
      _matchesPage.value = res.page;
      _matchesLimit.value = res.limit;
    } catch (err) {
      _matchesError.value = err instanceof Error ? err.message : 'خطا در بارگذاری مسابقات.';
    } finally {
      _matchesLoading.value = false;
    }
  }

  async function generateMatches(tournamentId: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res: AdminTournamentMatchListResponseDto = await matchesApi.generateMatches(
        useAdminApiClient(),
        tournamentId,
      );
      _matches.value = res.items;
      _matchesTotal.value = res.total;
      _actionSuccess.value = `${res.items.length} مسابقه تولید شد.`;
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در تولید مسابقات.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function createMatch(
    tournamentId: string,
    input: CreateTournamentMatchDto,
  ): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const created = await matchesApi.createMatch(useAdminApiClient(), tournamentId, input);
      _matches.value = [..._matches.value, created].sort(
        (a, b) => a.round - b.round || a.matchNumber - b.matchNumber,
      );
      _matchesTotal.value += 1;
      _actionSuccess.value = 'مسابقه ایجاد شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ایجاد مسابقه.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function updateMatch(
    tournamentId: string,
    matchId: string,
    input: UpdateTournamentMatchDto,
  ): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await matchesApi.updateMatch(
        useAdminApiClient(),
        tournamentId,
        matchId,
        input,
      );
      _matches.value = _matches.value.map((m) => (m.id === matchId ? updated : m));
      _actionSuccess.value = 'مسابقه به‌روز شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ویرایش مسابقه.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function cancelMatch(tournamentId: string, matchId: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await matchesApi.cancelMatch(useAdminApiClient(), tournamentId, matchId);
      _matches.value = _matches.value.map((m) => (m.id === matchId ? updated : m));
      _actionSuccess.value = 'مسابقه لغو شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در لغو مسابقه.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  function clearActionState() {
    _actionLoading.value = false;
    _actionError.value = null;
    _actionSuccess.value = null;
  }

  return {
    // List
    matches: _matches,
    matchesTotal: _matchesTotal,
    matchesPage: _matchesPage,
    matchesLimit: _matchesLimit,
    matchesLoading: _matchesLoading,
    matchesError: _matchesError,
    loadMatches,

    // Actions
    generateMatches,
    createMatch,
    updateMatch,
    cancelMatch,

    // Action state
    actionLoading: _actionLoading,
    actionError: _actionError,
    actionSuccess: _actionSuccess,
    clearActionState,
  };
}
