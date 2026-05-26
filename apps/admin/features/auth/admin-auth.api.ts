import { ApiClientError, createAdminAuthClient, createApiClient } from '@dragon/sdk';
import type { AdminMeResponse, TokenResponse } from '@dragon/sdk';

/**
 * Calls POST /api/v1/auth/logout to revoke the current session and clear the dragon_refresh
 * HttpOnly cookie via the backend. Always resolves — errors are swallowed so local state
 * can be cleared regardless of network or server failures.
 */
export async function adminLogout(accessToken: string, apiBaseUrl: string): Promise<void> {
  try {
    const client = createApiClient({
      baseUrl: apiBaseUrl,
      credentials: 'include',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const adminAuth = createAdminAuthClient(client);
    await adminAuth.logout();
  } catch {
    // best-effort — local state must clear even if the backend is unreachable
  }
}

export async function adminLogin(
  phone: string,
  password: string,
  apiBaseUrl: string,
): Promise<{ token: string; identity: AdminMeResponse }> {
  const unauthenticatedClient = createApiClient({ baseUrl: apiBaseUrl, credentials: 'include' });
  const unauthenticatedAdminAuth = createAdminAuthClient(unauthenticatedClient);

  let tokenResponse: TokenResponse;

  try {
    tokenResponse = await unauthenticatedAdminAuth.login({ phone, password });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      throw new Error('Invalid credentials.');
    }

    throw new Error('Login failed. Please try again.');
  }

  const authenticatedClient = createApiClient({
    baseUrl: apiBaseUrl,
    credentials: 'include',
    headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
  });
  const authenticatedAdminAuth = createAdminAuthClient(authenticatedClient);

  let identity: AdminMeResponse;

  try {
    identity = await authenticatedAdminAuth.getMe();
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 403) {
      throw new Error('Access denied: insufficient admin permissions.');
    }

    throw new Error('Failed to verify admin access.');
  }

  return { token: tokenResponse.accessToken, identity };
}

export async function fetchAdminIdentity(
  accessToken: string,
  apiBaseUrl: string,
): Promise<AdminMeResponse> {
  const client = createApiClient({
    baseUrl: apiBaseUrl,
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const adminAuth = createAdminAuthClient(client);

  return adminAuth.getMe();
}
