export type AppEnvironment = 'local' | 'development' | 'test' | 'staging' | 'production';

export type HealthStatus = 'ok';

export interface HealthResponse {
  status: HealthStatus;
}
