import {
  applyPhase1DevSeedRuntimeDefaults,
  assertSafeSeedEnvironment,
  assertSafeSeedResetEnvironment,
} from './phase1-dev-seed.safety';

describe('phase1 dev seed safety guards', () => {
  const safeEnv = {
    NODE_ENV: 'development',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/dragon-local',
  } as const;

  it('allows local development seed environment', () => {
    expect(() => assertSafeSeedEnvironment(safeEnv)).not.toThrow();
  });

  it('refuses production NODE_ENV', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, NODE_ENV: 'production' }),
    ).toThrow('NODE_ENV=production');
  });

  it('refuses production-like database URIs', () => {
    expect(() =>
      assertSafeSeedEnvironment({
        ...safeEnv,
        MONGODB_URI: 'mongodb://db/dragon-production',
      }),
    ).toThrow('production-like');
  });

  it('refuses remote mongodb srv database URIs', () => {
    expect(() =>
      assertSafeSeedEnvironment({
        ...safeEnv,
        MONGODB_URI: 'mongodb+srv://example.local/db',
      }),
    ).toThrow('production-like');
  });

  it('refuses reset without explicit confirmation flag', () => {
    expect(() => assertSafeSeedResetEnvironment(safeEnv)).toThrow(
      'DRAGON_ALLOW_SEED_RESET=true',
    );
  });

  it('allows reset with explicit confirmation flag', () => {
    expect(() =>
      assertSafeSeedResetEnvironment({
        ...safeEnv,
        DRAGON_ALLOW_SEED_RESET: 'true',
      }),
    ).not.toThrow();
  });

  it('applies local/test auth defaults before Nest bootstrap', () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/dragon-local',
    };

    applyPhase1DevSeedRuntimeDefaults(env);

    expect(env.AUTH_ACCESS_TOKEN_TTL_SECONDS).toBe('900');
    expect(env.AUTH_REFRESH_TOKEN_TTL_DAYS).toBe('30');
    expect(env.AUTH_JWT_SECRET).toBeDefined();
    expect(env.SMS_PROVIDER).toBe('mock');
  });

  it('defaults missing NODE_ENV to development for seed command runtime only', () => {
    const env: NodeJS.ProcessEnv = {
      MONGODB_URI: 'mongodb://127.0.0.1:27017/dragon-local',
    };

    applyPhase1DevSeedRuntimeDefaults(env);

    expect(env.NODE_ENV).toBe('development');
    expect(env.AUTH_ACCESS_TOKEN_TTL_SECONDS).toBe('900');
  });

  it('does not override existing auth defaults', () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      AUTH_ACCESS_TOKEN_TTL_SECONDS: '1200',
    };

    applyPhase1DevSeedRuntimeDefaults(env);

    expect(env.AUTH_ACCESS_TOKEN_TTL_SECONDS).toBe('1200');
  });

  it('does not apply defaults in production', () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
    };

    applyPhase1DevSeedRuntimeDefaults(env);

    expect(env.AUTH_ACCESS_TOKEN_TTL_SECONDS).toBeUndefined();
  });
});
