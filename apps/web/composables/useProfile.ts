import { createProfileApi } from '../features/profile/profile-api';

export function useProfile() {
  const runtimeConfig = useRuntimeConfig();
  const { token } = useAuthToken();

  return computed(() =>
    createProfileApi({
      baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
      token: token.value,
    }),
  );
}
