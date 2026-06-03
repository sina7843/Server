import { ref } from 'vue';
import type { TournamentMatchResultDto } from '@dragon/types';
import type {
  CreateMatchResultDto,
  UpdateMatchResultDto,
} from '~/features/tournaments/admin-tournament-results.api';
import * as resultsApi from '~/features/tournaments/admin-tournament-results.api';

export type { CreateMatchResultDto, UpdateMatchResultDto };

// ─── Last result state ────────────────────────────────────────────────────────

const _lastResult = ref<TournamentMatchResultDto | null>(null);

// ─── Action state ─────────────────────────────────────────────────────────────

const _actionLoading = ref(false);
const _actionError = ref<string | null>(null);
const _actionSuccess = ref<string | null>(null);

export function useAdminTournamentResults() {
  async function recordResult(
    tournamentId: string,
    matchId: string,
    input: CreateMatchResultDto,
  ): Promise<TournamentMatchResultDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const result = await resultsApi.recordResult(
        useAdminApiClient(),
        tournamentId,
        matchId,
        input,
      );
      _lastResult.value = result;
      _actionSuccess.value = 'نتیجه ثبت شد.';
      return result;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ثبت نتیجه.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function updateResult(
    tournamentId: string,
    matchId: string,
    input: UpdateMatchResultDto,
  ): Promise<TournamentMatchResultDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const result = await resultsApi.updateResult(
        useAdminApiClient(),
        tournamentId,
        matchId,
        input,
      );
      _lastResult.value = result;
      _actionSuccess.value = 'نتیجه به‌روز شد.';
      return result;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در به‌روزرسانی نتیجه.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function voidResult(tournamentId: string, matchId: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      await resultsApi.voidResult(useAdminApiClient(), tournamentId, matchId);
      _lastResult.value = null;
      _actionSuccess.value = 'نتیجه باطل شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در باطل کردن نتیجه.';
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
    // Last result
    lastResult: _lastResult,

    // Actions
    recordResult,
    updateResult,
    voidResult,

    // Action state
    actionLoading: _actionLoading,
    actionError: _actionError,
    actionSuccess: _actionSuccess,
    clearActionState,
  };
}
