import type { ApiClient } from './client';
import type { EsportsClient } from './esports-types';
import type { EsportsHomeDto } from '@dragon/types';

export function createEsportsClient(client: ApiClient): EsportsClient {
  return {
    getHome(): Promise<EsportsHomeDto> {
      return client.request<EsportsHomeDto>({
        method: 'GET',
        path: '/api/v1/home',
      });
    },
  };
}
