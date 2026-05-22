import { createAdminUsersClient } from '@dragon/sdk';
import type {
  ApiClient,
  AdminGenericResponse,
  AdminUserDetailResponse,
  AdminUserSessionsResponse,
  AdminUsersListParams,
  AdminUsersListResponse,
} from '@dragon/sdk';
import type { AdminUserStatusUpdateTarget } from '@dragon/types';

export async function listUsers(
  client: ApiClient,
  params?: AdminUsersListParams,
): Promise<AdminUsersListResponse> {
  return createAdminUsersClient(client).listUsers(params);
}

export async function getUser(
  client: ApiClient,
  id: string,
): Promise<AdminUserDetailResponse> {
  return createAdminUsersClient(client).getUser(id);
}

export async function updateUserStatus(
  client: ApiClient,
  id: string,
  status: AdminUserStatusUpdateTarget,
  reason?: string,
): Promise<AdminUserDetailResponse> {
  return createAdminUsersClient(client).updateUserStatus(id, {
    status,
    ...(reason !== undefined && reason.trim().length > 0 ? { reason: reason.trim() } : {}),
  });
}

export async function listUserSessions(
  client: ApiClient,
  id: string,
): Promise<AdminUserSessionsResponse> {
  return createAdminUsersClient(client).listUserSessions(id);
}

export async function revokeUserSession(
  client: ApiClient,
  userId: string,
  sessionId: string,
): Promise<AdminGenericResponse> {
  return createAdminUsersClient(client).revokeUserSession(userId, sessionId);
}
