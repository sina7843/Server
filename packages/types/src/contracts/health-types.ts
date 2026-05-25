export type HealthStatus = 'ok' | 'degraded' | 'down' | 'unknown';

export interface HealthLiveDto {
  readonly status: 'ok';
  readonly service: 'api';
  readonly timestamp: string;
}

export interface HealthDependencyDto {
  readonly status: HealthStatus;
  readonly latencyMs?: number;
}

export interface HealthReadyDto {
  readonly status: HealthStatus;
  readonly service: 'api';
  readonly timestamp: string;
  readonly dependencies: {
    readonly mongodb: HealthDependencyDto;
    readonly redis: HealthDependencyDto;
  };
}

export interface HealthDependenciesDto {
  readonly status: HealthStatus;
  readonly service: 'api';
  readonly timestamp: string;
  readonly dependencies: {
    readonly mongodb: HealthDependencyDto;
    readonly redis: HealthDependencyDto;
    readonly storage: { readonly status: HealthStatus };
    readonly sms: { readonly status: HealthStatus };
  };
}
