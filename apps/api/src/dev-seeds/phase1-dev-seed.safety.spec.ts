import {
  assertSafeSeedEnvironment,
  assertSafeSeedResetEnvironment,
} from './phase1-dev-seed.safety';

describe('phase1 dev seed safety guards', () => {
  // camelCase field names match the canonical Phase1DevSeedSafetyEnv in safety.ts.
  // SCREAMING_SNAKE_CASE was the old types.ts shape — the duplicate was removed.
  const safeEnv = {
    nodeEnv: 'development',
    mongodbUri: 'mongodb://127.0.0.1:27017/dragon-local',
  } as const;

  // ─── assertSafeSeedEnvironment ────────────────────────────────────────────

  it('allows local development seed environment', () => {
    expect(() => assertSafeSeedEnvironment(safeEnv)).not.toThrow();
  });

  it('allows test NODE_ENV', () => {
    expect(() => assertSafeSeedEnvironment({ ...safeEnv, nodeEnv: 'test' })).not.toThrow();
  });

  it('allows local NODE_ENV', () => {
    expect(() => assertSafeSeedEnvironment({ ...safeEnv, nodeEnv: 'local' })).not.toThrow();
  });

  it('refuses production NODE_ENV', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, nodeEnv: 'production' }),
    ).toThrow('NODE_ENV=production');
  });

  it('refuses staging NODE_ENV (not in allowed list)', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, nodeEnv: 'staging' }),
    ).toThrow();
  });

  it('refuses missing mongodbUri', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: undefined }),
    ).toThrow('MONGODB_URI is missing');
  });

  it('refuses empty mongodbUri', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: '' }),
    ).toThrow('MONGODB_URI is missing');
  });

  // ─── URI allowlist — local Docker/dev hosts ───────────────────────────────

  it('allows mongodb://localhost:27017/dragon-local', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: 'mongodb://localhost:27017/dragon-local' }),
    ).not.toThrow();
  });

  it('allows mongodb://127.0.0.1:27017/dragon-local', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: 'mongodb://127.0.0.1:27017/dragon-local' }),
    ).not.toThrow();
  });

  it('allows mongodb://mongo:27017/dragon-local (Docker Compose service name)', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: 'mongodb://mongo:27017/dragon-local' }),
    ).not.toThrow();
  });

  it('allows mongodb://mongodb:27017/dragon-local (Docker Compose service name)', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: 'mongodb://mongodb:27017/dragon-local' }),
    ).not.toThrow();
  });

  it('allows mongodb://db/dragon-local (Docker Compose db service)', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: 'mongodb://db/dragon-local' }),
    ).not.toThrow();
  });

  // ─── URI blocklist — remote/cloud/production ──────────────────────────────

  it('refuses mongodb+srv:// (Atlas / remote cluster)', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: 'mongodb+srv://user:pass@cluster.mongodb.net/dragon' }),
    ).toThrow('mongodb+srv://');
  });

  it('refuses non-local remote host', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: 'mongodb://company-db-server:27017/dragon' }),
    ).toThrow();
  });

  it('refuses production-looking database name', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: 'mongodb://127.0.0.1:27017/dragon-production' }),
    ).toThrow('production or staging');
  });

  it('refuses staging-looking database name', () => {
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: 'mongodb://127.0.0.1:27017/app-staging' }),
    ).toThrow('production or staging');
  });

  it('refuses standalone "prod" database name (not substring of "products")', () => {
    // "app-prod-db" — "prod" as a dash-delimited word.
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: 'mongodb://127.0.0.1:27017/app-prod-db' }),
    ).toThrow('production or staging');
  });

  it('does NOT refuse local database with "products" in the name', () => {
    // "products" contains "prod" as a substring but not as a standalone word — must not be blocked.
    expect(() =>
      assertSafeSeedEnvironment({ ...safeEnv, mongodbUri: 'mongodb://localhost:27017/products-local' }),
    ).not.toThrow();
  });

  // ─── assertSafeSeedResetEnvironment ──────────────────────────────────────

  it('refuses reset without explicit confirmation flag', () => {
    expect(() => assertSafeSeedResetEnvironment(safeEnv)).toThrow(
      'DRAGON_ALLOW_SEED_RESET=true',
    );
  });

  it('allows reset with explicit confirmation flag', () => {
    expect(() =>
      assertSafeSeedResetEnvironment({ ...safeEnv, allowSeedReset: 'true' }),
    ).not.toThrow();
  });

  it('refuses reset when confirmation flag is wrong value', () => {
    expect(() =>
      assertSafeSeedResetEnvironment({ ...safeEnv, allowSeedReset: '1' }),
    ).toThrow('DRAGON_ALLOW_SEED_RESET=true');
  });

  it('refuses reset with production NODE_ENV', () => {
    expect(() =>
      assertSafeSeedResetEnvironment({ ...safeEnv, nodeEnv: 'production', allowSeedReset: 'true' }),
    ).toThrow('NODE_ENV=production');
  });

  it('refuses reset with missing mongodbUri', () => {
    expect(() =>
      assertSafeSeedResetEnvironment({ ...safeEnv, mongodbUri: undefined, allowSeedReset: 'true' }),
    ).toThrow('MONGODB_URI is missing');
  });
});
