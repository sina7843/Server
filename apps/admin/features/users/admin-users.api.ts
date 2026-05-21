import { ApiClientError, createAdminUsersClient, createApiClient } from '@dragon/sdk';
import type {
  AdminGenericResponse,
  AdminUserDetailResponse,
  AdminUserSessionsResponse,
  AdminUserStatus,
  AdminUsersListParams,
  AdminUsersListResponse,
} from '@dragon/sdk';
import { useAdminAuthState } from '~/composables/useAdminAuthState';

function getAdminUsersClient() {
  const { accessToken } = useAdminAuthState();

  if (!accessToken.value) {
    throw new ApiClientError('Not authenticated.', 401);
  }

  const client = createApiClient({
    baseUrl: '/',
    headers: { Authorization: `Bearer ${accessToken.value}` },
  });

  return createAdminUsersClient(client);
}

export async function listUsers(params?: AdminUsersListParams): Promise<AdminUsersListResponse> {
  return getAdminUsersClient().listUsers(params);
}

export async function getUser(id: string): Promise<AdminUserDetailResponse> {
  return getAdminUsersClient().getUser(id);
}

export async function updateUserStatus(
  id: string,
  status: AdminUserStatus,
  reason?: string,
): Promise<AdminUserDetailResponse> {
  return getAdminUsersClient().updateUserStatus(id, {
    status,
    ...(reason !== undefined && reason.trim().length > 0 ? { reason: reason.trim() } : {}),
  });
}

export async function listUserSessions(id: string): Promise<AdminUserSessionsResponse> {
  return getAdminUsersClient().listUserSessions(id);
}

export async function revokeUserSession(
  userId: string,
  sessionId: string,
): Promise<AdminGenericResponse> {
  return getAdminUsersClient().revokeUserSession(userId, sessionId);
}
