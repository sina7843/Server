import { createApiClient, createSearchClient } from '@dragon/sdk';
import type { ApiClientOptions, ApiFetch } from '@dragon/sdk';

export interface SearchApiOptions {
  readonly baseUrl?: string;
  readonly fetcher?: ApiFetch;
}

export function createSearchApi(options: SearchApiOptions = {}) {
  const apiClientOptions: ApiClientOptions = {
    baseUrl: options.baseUrl ?? '/',
  };

  if (options.fetcher !== undefined) {
    apiClientOptions.fetch = options.fetcher;
  }

  return createSearchClient(createApiClient(apiClientOptions));
}
