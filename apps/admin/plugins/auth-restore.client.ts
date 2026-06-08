import { createApiClient, createAdminAuthClient } from '@dragon/sdk';
import { useAdminAuthState } from '~/composables/useAdminAuthState';
import { useAdminPermissions } from '~/composables/useAdminPermissions';

export default defineNuxtPlugin(async () => {
  const { accessToken, setAuth } = useAdminAuthState();
  if (accessToken.value) return;

  const { setPermissions } = useAdminPermissions();
  const {
    public: { apiBaseUrl },
  } = useRuntimeConfig();

  try {
    const unauthClient = createApiClient({ baseUrl: String(apiBaseUrl), credentials: 'include' });
    const unauthAdminAuth = createAdminAuthClient(unauthClient);
    const tokenResponse = await unauthAdminAuth.refresh();

    const authClient = createApiClient({
      baseUrl: String(apiBaseUrl),
      credentials: 'include',
      headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
    });
    const authAdminAuth = createAdminAuthClient(authClient);
    const identity = await authAdminAuth.getMe();

    setAuth(tokenResponse.accessToken, identity);
    setPermissions(identity.permissions, identity.isSuperAdmin);
  } catch {
    // no valid session — middleware will redirect to /login
  }
});
