import type { EsportsHomeDto } from '@dragon/types';

export interface EsportsClient {
  getHome(): Promise<EsportsHomeDto>;
}
