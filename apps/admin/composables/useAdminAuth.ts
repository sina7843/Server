import { computed } from 'vue';
import { useAdminAuthState } from '~/composables/useAdminAuthState';
import { useAdminPermissions } from '~/composables/useAdminPermissions';

export function useAdminAuth() {
  const { accessToken, identity, clearAuth } = useAdminAuthState();
  const { clearPermissions } = useAdminPermissions();

  const isAuthenticated = computed(() => !!accessToken.value);

  const displayName = computed(() => identity.value?.user.id ?? '');

  function logout() {
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
