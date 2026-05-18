import { createApiClient, createProfilesClient } from '@dragon/sdk';

export interface ProfileApiOptions {
  readonly baseUrl?: string;
  readonly token?: string | null;
  readonly fetcher?: typeof fetch;
}

export function createProfileApi(options: ProfileApiOptions = {}) {
  const apiClient = createApiClient({
    baseUrl: options.baseUrl ?? '/',
    fetch: options.fetcher,
    headers: options.token
      ? {
          authorization: `Bearer ${options.token}`,
        }
      : undefined,
  });

  return createProfilesClient(apiClient);
}
