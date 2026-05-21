import type { ApiClient } from './client';
import type {
  AdminDashboardSummaryResponse,
  AdminSystemHealthResponse,
} from './admin-dashboard-types';

export interface AdminDashboardClient {
  getSummary(): Promise<AdminDashboardSummaryResponse>;
}

export interface AdminSystemClient {
  getHealth(): Promise<AdminSystemHealthResponse>;
}

export function createAdminDashboardClient(client: ApiClient): AdminDashboardClient {
  return {
    getSummary() {
      return client.request<AdminDashboardSummaryResponse>({
        method: 'GET',
        path: '/admin/v1/dashboard/summary',
      });
    },
  };
}

export function createAdminSystemClient(client: ApiClient): AdminSystemClient {
  return {
    getHealth() {
      return client.request<AdminSystemHealthResponse>({
        method: 'GET',
        path: '/admin/v1/system/health',
      });
    },
  };
}
