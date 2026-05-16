export type AppEnvironment = 'development' | 'test' | 'production';

export type HealthStatus = 'ok';

export interface HealthResponse {
  status: HealthStatus;
}
