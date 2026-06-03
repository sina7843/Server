import { ref } from 'vue';
import type { BracketProjectionDto } from '@dragon/types';
import * as bracketApi from '~/features/tournaments/admin-tournament-bracket.api';

// ─── Bracket state ────────────────────────────────────────────────────────────

const _bracket = ref<BracketProjectionDto | null>(null);
const _bracketLoading = ref(false);
const _bracketError = ref<string | null>(null);

export function useAdminTournamentBracket() {
  async function loadBracket(tournamentId: string) {
    _bracketLoading.value = true;
    _bracketError.value = null;

    try {
      _bracket.value = await bracketApi.getBracket(useAdminApiClient(), tournamentId);
    } catch (err) {
      _bracketError.value = err instanceof Error ? err.message : 'خطا در بارگذاری نمای درختی.';
    } finally {
      _bracketLoading.value = false;
    }
  }

  function clearState() {
    _bracket.value = null;
    _bracketLoading.value = false;
    _bracketError.value = null;
  }

  return {
    bracket: _bracket,
    bracketLoading: _bracketLoading,
    bracketError: _bracketError,
    loadBracket,
    clearState,
  };
}
