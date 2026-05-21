export interface AdminDashboardUserStats {
  readonly total: number;
  readonly active?: number;
  readonly pending?: number;
}

export interface AdminDashboardSystemStatus {
  readonly status: 'ok' | 'degraded' | 'unavailable';
}

export interface AdminDashboardSummaryResponse {
  readonly users?: AdminDashboardUserStats;
  readonly system?: AdminDashboardSystemStatus;
  readonly unavailable?: readonly string[];
}

export interface AdminSystemHealthResponse {
  readonly status: 'ok' | 'degraded' | 'unavailable';
  readonly service: 'api';
  readonly version?: string;
  readonly checkedAt: string;
}
