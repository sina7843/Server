import {
  createApiClient,
  createTournamentsClient,
  type ApiClientOptions,
  type ApiFetch,
  type TournamentsClient,
} from '@dragon/sdk';

export interface RegistrationApiOptions {
  readonly baseUrl?: string;
  readonly token?: string | null;
  readonly fetcher?: ApiFetch;
}

export function createRegistrationApi(options: RegistrationApiOptions = {}): TournamentsClient {
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

  return createTournamentsClient(createApiClient(apiClientOptions));
}
