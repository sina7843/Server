import {
  createApiClient,
  createEsportsClient,
  type ApiClientOptions,
  type ApiFetch,
} from '@dragon/sdk';

export interface EsportsApiOptions {
  readonly baseUrl?: string;
  readonly fetcher?: ApiFetch;
}

export function createEsportsApi(options: EsportsApiOptions = {}) {
  const apiClientOptions: ApiClientOptions = {
    baseUrl: options.baseUrl ?? '/',
  };

  if (options.fetcher !== undefined) {
    apiClientOptions.fetch = options.fetcher;
  }

  return createEsportsClient(createApiClient(apiClientOptions));
}
