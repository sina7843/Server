import {
  createApiClient,
  createProfilesClient,
  type ApiClientOptions,
  type ApiFetch,
} from '@dragon/sdk';

export interface ProfileApiOptions {
  readonly baseUrl?: string;
  readonly token?: string | null;
  readonly fetcher?: ApiFetch;
}

export function createProfileApi(options: ProfileApiOptions = {}) {
  const apiClientOptions: ApiClientOptions = {
    baseUrl: options.baseUrl ?? '/',
  };

  if (options.fetcher !== undefined) {
    apiClientOptions.fetch = options.fetcher;
  }

  if (options.token) {
    apiClientOptions.headers = {
      authorization: `Bearer ${options.token}`,
    };
  }

  return createProfilesClient(createApiClient(apiClientOptions));
}
