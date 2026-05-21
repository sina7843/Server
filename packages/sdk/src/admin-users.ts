import type { ApiClient } from './client';
import type {
  AdminGenericResponse,
  AdminUserDetailResponse,
  AdminUserSessionsResponse,
  AdminUserStatusUpdateRequest,
  AdminUsersListParams,
  AdminUsersListResponse,
} from './admin-users-types';

export interface AdminUsersClient {
  listUsers(params?: AdminUsersListParams): Promise<AdminUsersListResponse>;
  getUser(id: string): Promise<AdminUserDetailResponse>;
  updateUserStatus(
    id: string,
    input: AdminUserStatusUpdateRequest,
  ): Promise<AdminUserDetailResponse>;
  listUserSessions(id: string): Promise<AdminUserSessionsResponse>;
  revokeUserSession(id: string, sessionId: string): Promise<AdminGenericResponse>;
}

export function createAdminUsersClient(client: ApiClient): AdminUsersClient {
  return {
    listUsers(params?: AdminUsersListParams) {
      const searchParams = new URLSearchParams();

      if (params?.status) searchParams.set('status', params.status);
      if (params?.q) searchParams.set('q', params.q);
      if (params?.page !== undefined) searchParams.set('page', String(params.page));
      if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));

      const query = searchParams.toString();

      return client.request<AdminUsersListResponse>({
        method: 'GET',
        path: `/admin/v1/users${query ? `?${query}` : ''}`,
      });
    },

    getUser(id: string) {
      return client.request<AdminUserDetailResponse>({
        method: 'GET',
        path: `/admin/v1/users/${encodeURIComponent(id)}`,
      });
    },

    updateUserStatus(id: string, input: AdminUserStatusUpdateRequest) {
      return client.request<AdminUserDetailResponse>({
        method: 'PATCH',
        path: `/admin/v1/users/${encodeURIComponent(id)}/status`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },

    listUserSessions(id: string) {
      return client.request<AdminUserSessionsResponse>({
        method: 'GET',
        path: `/admin/v1/users/${encodeURIComponent(id)}/sessions`,
      });
    },

    revokeUserSession(id: string, sessionId: string) {
      return client.request<AdminGenericResponse>({
        method: 'DELETE',
        path: `/admin/v1/users/${encodeURIComponent(id)}/sessions/${encodeURIComponent(sessionId)}`,
      });
    },
  };
}
