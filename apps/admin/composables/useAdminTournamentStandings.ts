import { ref } from 'vue';
import type { TournamentStandingsDto, RecalculateStandingsResultDto } from '@dragon/types';
import * as standingsApi from '~/features/tournaments/admin-tournament-standings.api';

// ─── Standings state ──────────────────────────────────────────────────────────

const _standings = ref<TournamentStandingsDto | null>(null);
const _standingsLoading = ref(false);
const _standingsError = ref<string | null>(null);

// ─── Action state ─────────────────────────────────────────────────────────────

const _actionLoading = ref(false);
const _actionError = ref<string | null>(null);
const _actionSuccess = ref<string | null>(null);

export function useAdminTournamentStandings() {
  async function loadStandings(tournamentId: string) {
    _standingsLoading.value = true;
    _standingsError.value = null;

    try {
      _standings.value = await standingsApi.getStandings(useAdminApiClient(), tournamentId);
    } catch (err) {
      _standingsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری جدول امتیازات.';
    } finally {
      _standingsLoading.value = false;
    }
  }

  async function recalculateStandings(
    tournamentId: string,
  ): Promise<RecalculateStandingsResultDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const result = await standingsApi.recalculateStandings(useAdminApiClient(), tournamentId);
      _actionSuccess.value = 'جدول امتیازات محاسبه مجدد شد.';
      return result;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در محاسبه مجدد جدول امتیازات.';
      return null;
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
    // Standings data
    standings: _standings,
    standingsLoading: _standingsLoading,
    standingsError: _standingsError,
    loadStandings,

    // Actions
    recalculateStandings,

    // Action state
    actionLoading: _actionLoading,
    actionError: _actionError,
    actionSuccess: _actionSuccess,
    clearActionState,
  };
}
