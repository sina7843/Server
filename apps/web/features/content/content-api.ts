import {
  createApiClient,
  createContentClient,
  type ApiClientOptions,
  type ApiFetch,
} from '@dragon/sdk';

export interface ContentApiOptions {
  readonly baseUrl?: string;
  readonly fetcher?: ApiFetch;
}

export function createContentApi(options: ContentApiOptions = {}) {
  const apiClientOptions: ApiClientOptions = {
    baseUrl: options.baseUrl ?? '/',
  };

  if (options.fetcher !== undefined) {
    apiClientOptions.fetch = options.fetcher;
  }

  return createContentClient(createApiClient(apiClientOptions));
}
