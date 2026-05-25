import type { ApiClient } from './client';
import type { HealthLiveDto, HealthReadyDto, HealthDependenciesDto } from './system-health-types';

export interface SystemHealthClient {
  getLive(): Promise<HealthLiveDto>;
  getReady(): Promise<HealthReadyDto>;
  getDependencies(): Promise<HealthDependenciesDto>;
}

export function createSystemHealthClient(client: ApiClient): SystemHealthClient {
  return {
    getLive() {
      return client.request<HealthLiveDto>({ method: 'GET', path: '/health/live' });
    },
    getReady() {
      return client.request<HealthReadyDto>({ method: 'GET', path: '/health/ready' });
    },
    getDependencies() {
      return client.request<HealthDependenciesDto>({ method: 'GET', path: '/health/dependencies' });
    },
  };
}
