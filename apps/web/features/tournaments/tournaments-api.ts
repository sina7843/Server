import {
  createApiClient,
  createTournamentsClient,
  createSearchClient,
  createGamesClient,
  type ApiClientOptions,
  type ApiFetch,
  type TournamentsClient,
  type SearchClient,
  type GamesClient,
} from '@dragon/sdk';

export interface TournamentsDiscoveryApiOptions {
  readonly baseUrl?: string;
  readonly fetcher?: ApiFetch;
}

export function createTournamentsDiscoveryApi(
  options: TournamentsDiscoveryApiOptions = {},
): TournamentsClient {
  const apiClientOptions: ApiClientOptions = {
    baseUrl: options.baseUrl ?? '/',
  };

  if (options.fetcher !== undefined) {
    apiClientOptions.fetch = options.fetcher;
  }

  return createTournamentsClient(createApiClient(apiClientOptions));
}

export function createTournamentSearchApi(
  options: TournamentsDiscoveryApiOptions = {},
): SearchClient {
  const apiClientOptions: ApiClientOptions = {
    baseUrl: options.baseUrl ?? '/',
  };

  if (options.fetcher !== undefined) {
    apiClientOptions.fetch = options.fetcher;
  }

  return createSearchClient(createApiClient(apiClientOptions));
}

export function createGamesDiscoveryApi(options: TournamentsDiscoveryApiOptions = {}): GamesClient {
  const apiClientOptions: ApiClientOptions = {
    baseUrl: options.baseUrl ?? '/',
  };

  if (options.fetcher !== undefined) {
    apiClientOptions.fetch = options.fetcher;
  }

  return createGamesClient(createApiClient(apiClientOptions));
}
