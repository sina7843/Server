import { ref } from 'vue';
import type { AdminTournamentRegistrationDto, RegistrationStatus } from '@dragon/types';
import type { AdminTournamentRegistrationListResponseDto } from '@dragon/sdk';
import * as registrationsApi from '~/features/tournaments/admin-tournament-registrations.api';

// ─── List state ───────────────────────────────────────────────────────────────

const _registrations = ref<readonly AdminTournamentRegistrationDto[]>([]);
const _registrationsTotal = ref(0);
const _registrationsPage = ref(1);
const _registrationsLimit = ref(20);
const _registrationsLoading = ref(false);
const _registrationsError = ref<string | null>(null);

// ─── Detail state ─────────────────────────────────────────────────────────────

const _registration = ref<AdminTournamentRegistrationDto | null>(null);
const _registrationLoading = ref(false);
const _registrationError = ref<string | null>(null);

// ─── Action state ─────────────────────────────────────────────────────────────

const _actionLoading = ref(false);
const _actionError = ref<string | null>(null);
const _actionSuccess = ref<string | null>(null);

export function useAdminTournamentRegistrations() {
  async function loadRegistrations(
    tournamentId: string,
    params?: {
      status?: RegistrationStatus;
      type?: 'individual' | 'team';
      page?: number;
      limit?: number;
    },
  ) {
    _registrationsLoading.value = true;
    _registrationsError.value = null;

    try {
      const res: AdminTournamentRegistrationListResponseDto =
        await registrationsApi.listRegistrations(useAdminApiClient(), tournamentId, params);
      _registrations.value = res.items;
      _registrationsTotal.value = res.total;
      _registrationsPage.value = res.page;
      _registrationsLimit.value = res.limit;
    } catch (err) {
      _registrationsError.value =
        err instanceof Error ? err.message : 'خطا در بارگذاری ثبت‌نام‌ها.';
    } finally {
      _registrationsLoading.value = false;
    }
  }

  async function loadRegistration(tournamentId: string, registrationId: string) {
    _registration.value = null;
    _registrationLoading.value = true;
    _registrationError.value = null;

    try {
      _registration.value = await registrationsApi.getRegistration(
        useAdminApiClient(),
        tournamentId,
        registrationId,
      );
    } catch (err) {
      _registrationError.value =
        err instanceof Error ? err.message : 'خطا در بارگذاری جزئیات ثبت‌نام.';
    } finally {
      _registrationLoading.value = false;
    }
  }

  async function approveRegistration(
    tournamentId: string,
    registrationId: string,
  ): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await registrationsApi.approveRegistration(
        useAdminApiClient(),
        tournamentId,
        registrationId,
      );
      _registrations.value = _registrations.value.map((r) =>
        r.id === registrationId ? updated : r,
      );
      if (_registration.value?.id === registrationId) _registration.value = updated;
      _actionSuccess.value = 'ثبت‌نام تأیید شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در تأیید ثبت‌نام.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function rejectRegistration(
    tournamentId: string,
    registrationId: string,
    input?: { reason?: string },
  ): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await registrationsApi.rejectRegistration(
        useAdminApiClient(),
        tournamentId,
        registrationId,
        input,
      );
      _registrations.value = _registrations.value.map((r) =>
        r.id === registrationId ? updated : r,
      );
      if (_registration.value?.id === registrationId) _registration.value = updated;
      _actionSuccess.value = 'ثبت‌نام رد شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در رد ثبت‌نام.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function cancelRegistration(
    tournamentId: string,
    registrationId: string,
  ): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const updated = await registrationsApi.cancelRegistration(
        useAdminApiClient(),
        tournamentId,
        registrationId,
      );
      _registrations.value = _registrations.value.map((r) =>
        r.id === registrationId ? updated : r,
      );
      if (_registration.value?.id === registrationId) _registration.value = updated;
      _actionSuccess.value = 'ثبت‌نام لغو شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در لغو ثبت‌نام.';
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
    registrations: _registrations,
    registrationsTotal: _registrationsTotal,
    registrationsPage: _registrationsPage,
    registrationsLimit: _registrationsLimit,
    registrationsLoading: _registrationsLoading,
    registrationsError: _registrationsError,
    loadRegistrations,

    // Detail
    registration: _registration,
    registrationLoading: _registrationLoading,
    registrationError: _registrationError,
    loadRegistration,

    // Actions
    approveRegistration,
    rejectRegistration,
    cancelRegistration,

    // Action state
    actionLoading: _actionLoading,
    actionError: _actionError,
    actionSuccess: _actionSuccess,
    clearActionState,
  };
}
