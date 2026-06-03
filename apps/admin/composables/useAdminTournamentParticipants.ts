import { ref } from 'vue';
import type { TournamentParticipantDto, ParticipantStatus } from '@dragon/types';
import type { AdminTournamentParticipantListResponseDto } from '@dragon/sdk';
import type { UpdateTournamentParticipantDto } from '~/features/tournaments/admin-tournament-participants.api';
import * as participantsApi from '~/features/tournaments/admin-tournament-participants.api';

// ─── List state ───────────────────────────────────────────────────────────────

const _participants = ref<readonly TournamentParticipantDto[]>([]);
const _participantsTotal = ref(0);
const _participantsPage = ref(1);
const _participantsLimit = ref(20);
const _participantsLoading = ref(false);
const _participantsError = ref<string | null>(null);

// ─── Action state ─────────────────────────────────────────────────────────────

const _actionLoading = ref(false);
const _actionError = ref<string | null>(null);
const _actionSuccess = ref<string | null>(null);

export function useAdminTournamentParticipants() {
  async function loadParticipants(
    tournamentId: string,
    params?: { status?: ParticipantStatus; page?: number; limit?: number },
  ) {
    _participantsLoading.value = true;
    _participantsError.value = null;

    try {
      const res: AdminTournamentParticipantListResponseDto = await participantsApi.listParticipants(
        useAdminApiClient(),
        tournamentId,
        params,
      );
      _participants.value = res.items;
      _participantsTotal.value = res.total;
      _participantsPage.value = res.page;
      _participantsLimit.value = res.limit;
    } catch (err) {
      _participantsError.value =
        err instanceof Error ? err.message : 'خطا در بارگذاری شرکت‌کنندگان.';
    } finally {
      _participantsLoading.value = false;
    }
  }

  async function updateParticipant(
    tournamentId: string,
    participantId: string,
    input: UpdateTournamentParticipantDto,
  ): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await participantsApi.updateParticipant(
        useAdminApiClient(),
        tournamentId,
        participantId,
        input,
      );
      _participants.value = _participants.value.map((p) => (p.id === participantId ? updated : p));
      _actionSuccess.value = 'اطلاعات شرکت‌کننده به‌روز شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در به‌روزرسانی شرکت‌کننده.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function removeParticipant(tournamentId: string, participantId: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      await participantsApi.removeParticipant(useAdminApiClient(), tournamentId, participantId);
      _participants.value = _participants.value.filter((p) => p.id !== participantId);
      _participantsTotal.value = Math.max(0, _participantsTotal.value - 1);
      _actionSuccess.value = 'شرکت‌کننده حذف شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در حذف شرکت‌کننده.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function disqualifyParticipant(
    tournamentId: string,
    participantId: string,
  ): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await participantsApi.disqualifyParticipant(
        useAdminApiClient(),
        tournamentId,
        participantId,
      );
      _participants.value = _participants.value.map((p) => (p.id === participantId ? updated : p));
      _actionSuccess.value = 'شرکت‌کننده محروم شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در محروم کردن شرکت‌کننده.';
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
    participants: _participants,
    participantsTotal: _participantsTotal,
    participantsPage: _participantsPage,
    participantsLimit: _participantsLimit,
    participantsLoading: _participantsLoading,
    participantsError: _participantsError,
    loadParticipants,

    // Actions
    updateParticipant,
    removeParticipant,
    disqualifyParticipant,

    // Action state
    actionLoading: _actionLoading,
    actionError: _actionError,
    actionSuccess: _actionSuccess,
    clearActionState,
  };
}
