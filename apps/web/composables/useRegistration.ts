import { createRegistrationApi } from '../features/registrations/registration-api';

export function useRegistration() {
  const runtimeConfig = useRuntimeConfig();
  const { token } = useAuthToken();

  return computed(() =>
    createRegistrationApi({
      baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
      token: token.value,
    }),
  );
}
