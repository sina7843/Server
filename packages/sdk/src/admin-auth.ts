import type { ApiClient } from './client';
import type { AdminMeResponse } from './admin-auth-types';
import type { TokenResponse } from './auth-types';

export interface AdminLoginRequest {
  readonly phone: string;
  readonly password: string;
  readonly deviceId?: string;
  readonly deviceName?: string;
}

export interface AdminAuthClient {
  login(request: AdminLoginRequest): Promise<TokenResponse>;
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

    getMe() {
      return client.request<AdminMeResponse>({
        method: 'GET',
        path: '/admin/v1/auth/me',
      });
    },
  };
}
