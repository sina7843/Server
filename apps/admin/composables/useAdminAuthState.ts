import { ref } from 'vue';
import type { AdminMeResponse } from '@dragon/sdk';

const _accessToken = ref<string | null>(null);
const _identity = ref<AdminMeResponse | null>(null);

export function useAdminAuthState() {
  function setAuth(token: string, identity: AdminMeResponse) {
    _accessToken.value = token;
    _identity.value = identity;
  }

  function clearAuth() {
    _accessToken.value = null;
    _identity.value = null;
  }

  return {
    accessToken: _accessToken,
    identity: _identity,
    setAuth,
    clearAuth,
  };
}
