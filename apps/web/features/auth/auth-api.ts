import { createApiClient, createAdminAuthClient, ApiClientError } from '@dragon/sdk';
import type { TokenResponse } from '@dragon/sdk';

export interface WebLoginResult {
  readonly accessToken: string;
  readonly isAdmin: boolean;
}

export async function webLogin(
  phone: string,
  password: string,
  apiBaseUrl: string,
): Promise<WebLoginResult> {
  const unauthClient = createApiClient({ baseUrl: apiBaseUrl, credentials: 'include' });
  const authClient = createAdminAuthClient(unauthClient);

  let tokenResponse: TokenResponse;
  try {
    tokenResponse = await authClient.login({ phone, password });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      throw new Error('شماره موبایل یا رمز عبور اشتباه است.');
    }
    throw new Error('خطا در ورود. لطفاً دوباره تلاش کنید.');
  }

  const authenticatedClient = createApiClient({
    baseUrl: apiBaseUrl,
    credentials: 'include',
    headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
  });
  const authenticatedAuthClient = createAdminAuthClient(authenticatedClient);

  let isAdmin = false;
  try {
    await authenticatedAuthClient.getMe();
    isAdmin = true;
  } catch {
    isAdmin = false;
  }

  return { accessToken: tokenResponse.accessToken, isAdmin };
}

export async function webLogout(accessToken: string, apiBaseUrl: string): Promise<void> {
  try {
    const client = createApiClient({
      baseUrl: apiBaseUrl,
      credentials: 'include',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const authClient = createAdminAuthClient(client);
    await authClient.logout();
  } catch {
    // best-effort
  }
}
