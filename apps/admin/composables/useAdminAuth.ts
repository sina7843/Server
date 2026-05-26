import { computed } from 'vue';
import { useAdminAuthState } from '~/composables/useAdminAuthState';
import { useAdminPermissions } from '~/composables/useAdminPermissions';
import { adminLogout } from '~/features/auth/admin-auth.api';

export function useAdminAuth() {
  const { accessToken, identity, clearAuth } = useAdminAuthState();
  const { clearPermissions } = useAdminPermissions();

  const isAuthenticated = computed(() => !!accessToken.value);

  const displayName = computed(() => identity.value?.user.id ?? '');

  async function logout() {
    const {
      public: { apiBaseUrl },
    } = useRuntimeConfig();
    if (accessToken.value) {
      await adminLogout(accessToken.value, String(apiBaseUrl));
    }
    clearAuth();
    clearPermissions();
  }

  return {
    isAuthenticated,
    identity,
    displayName,
    logout,
  };
}
