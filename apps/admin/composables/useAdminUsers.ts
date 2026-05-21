import { ref } from 'vue';
import type {
  AdminUserDetail,
  AdminUserListItem,
  AdminUserSessionSummary,
  AdminUserStatus,
  AdminUsersListParams,
} from '@dragon/sdk';
import * as usersApi from '~/features/users/admin-users.api';

const _users = ref<readonly AdminUserListItem[]>([]);
const _usersTotal = ref(0);
const _usersPage = ref(1);
const _usersLoading = ref(false);
const _usersError = ref<string | null>(null);

const _user = ref<AdminUserDetail | null>(null);
const _userLoading = ref(false);
const _userError = ref<string | null>(null);

const _sessions = ref<readonly AdminUserSessionSummary[]>([]);
const _sessionsLoading = ref(false);
const _sessionsError = ref<string | null>(null);

const _actionLoading = ref(false);
const _actionError = ref<string | null>(null);

export function useAdminUsers() {
  async function loadUsers(params?: AdminUsersListParams) {
    _usersLoading.value = true;
    _usersError.value = null;

    try {
      const res = await usersApi.listUsers(params);
      _users.value = res.users;
      _usersTotal.value = res.total;
      _usersPage.value = res.page;
    } catch (err) {
      _usersError.value = err instanceof Error ? err.message : 'خطا در بارگذاری کاربران.';
    } finally {
      _usersLoading.value = false;
    }
  }

  async function loadUser(id: string) {
    _user.value = null;
    _userLoading.value = true;
    _userError.value = null;

    try {
      const res = await usersApi.getUser(id);
      _user.value = res.user;
    } catch (err) {
      _userError.value = err instanceof Error ? err.message : 'خطا در بارگذاری کاربر.';
    } finally {
      _userLoading.value = false;
    }
  }

  async function loadSessions(userId: string) {
    _sessions.value = [];
    _sessionsLoading.value = true;
    _sessionsError.value = null;

    try {
      const res = await usersApi.listUserSessions(userId);
      _sessions.value = res.sessions;
    } catch (err) {
      _sessionsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری نشست‌ها.';
    } finally {
      _sessionsLoading.value = false;
    }
  }

  async function updateStatus(
    id: string,
    status: AdminUserStatus,
    reason?: string,
  ): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;

    try {
      const res = await usersApi.updateUserStatus(id, status, reason);
      _user.value = res.user;
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در تغییر وضعیت.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function revokeSession(userId: string, sessionId: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;

    try {
      await usersApi.revokeUserSession(userId, sessionId);
      _sessions.value = _sessions.value.map((s) =>
        s.id === sessionId ? { ...s, isActive: false, revokedAt: new Date().toISOString() } : s,
      );
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ابطال نشست.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  return {
    users: _users,
    usersTotal: _usersTotal,
    usersPage: _usersPage,
    usersLoading: _usersLoading,
    usersError: _usersError,

    user: _user,
    userLoading: _userLoading,
    userError: _userError,

    sessions: _sessions,
    sessionsLoading: _sessionsLoading,
    sessionsError: _sessionsError,

    actionLoading: _actionLoading,
    actionError: _actionError,

    loadUsers,
    loadUser,
    loadSessions,
    updateStatus,
    revokeSession,
  };
}
