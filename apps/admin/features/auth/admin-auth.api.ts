import { ApiClientError, createAdminAuthClient, createApiClient } from '@dragon/sdk';
import type { AdminMeResponse, TokenResponse } from '@dragon/sdk';

export async function adminLogin(
  phone: string,
  password: string,
  apiBaseUrl: string,
): Promise<{ token: string; identity: AdminMeResponse }> {
  const unauthenticatedClient = createApiClient({ baseUrl: apiBaseUrl });
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
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const adminAuth = createAdminAuthClient(client);

  return adminAuth.getMe();
}
