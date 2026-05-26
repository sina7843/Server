import type { ApiClient } from './client';
import type { AdminMeResponse } from './admin-auth-types';
import type { TokenResponse, LogoutResponse } from './auth-types';

export interface AdminLoginRequest {
  readonly phone: string;
  readonly password: string;
  readonly deviceId?: string;
  readonly deviceName?: string;
}

export interface AdminAuthClient {
  login(request: AdminLoginRequest): Promise<TokenResponse>;
  /** Rotates the access token using the dragon_refresh HttpOnly cookie. No request body needed. */
  refresh(): Promise<TokenResponse>;
  /**
   * Revokes the current session and clears the dragon_refresh HttpOnly cookie.
   * Must be called with credentials: 'include' so the browser sends the cookie.
   * Authorization Bearer header must be included when an access token exists.
   */
  logout(): Promise<LogoutResponse>;
  getMe(): Promise<AdminMeResponse>;
}

export function createAdminAuthClient(client: ApiClient): AdminAuthClient {
  return {
    login(request: AdminLoginRequest) {
      return client.request<TokenResponse>({
        method: 'POST',
        path: '/api/v1/auth/login',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      });
    },

    refresh() {
      return client.request<TokenResponse>({
        method: 'POST',
        path: '/api/v1/auth/refresh',
      });
    },

    logout() {
      return client.request<LogoutResponse>({
        method: 'POST',
        path: '/api/v1/auth/logout',
      });
    },

    getMe() {
      return client.request<AdminMeResponse>({
        method: 'GET',
        path: '/admin/v1/auth/me',
      });
    },
  };
}
