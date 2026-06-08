import { assertSafePhase1DevSeedTarget } from './seed-safety';

const SAFE_INPUT = {
  mongodbUri: 'mongodb://dragon_local:dragon_local_password@localhost:27017/dragon_local?authSource=admin',
  nodeEnv: 'development',
  appEnv: 'development',
  reset: false,
};

describe('Phase 1 dev seed safety', () => {
  it('allows local localhost MongoDB development targets', () => {
    expect(() => assertSafePhase1DevSeedTarget(SAFE_INPUT)).not.toThrow();
  });

  it('refuses reset without the explicit reset flag', () => {
    expect(() =>
      assertSafePhase1DevSeedTarget({ ...SAFE_INPUT, reset: true, allowReset: undefined }),
    ).toThrow(/DRAGON_ALLOW_SEED_RESET/);
  });

  it('allows reset with the explicit reset flag', () => {
    expect(() =>
      assertSafePhase1DevSeedTarget({ ...SAFE_INPUT, reset: true, allowReset: 'true' }),
    ).not.toThrow();
  });

  it('refuses production NODE_ENV', () => {
    expect(() =>
      assertSafePhase1DevSeedTarget({ ...SAFE_INPUT, nodeEnv: 'production' }),
    ).toThrow(/production/);
  });

  it('refuses staging APP_ENV', () => {
    expect(() => assertSafePhase1DevSeedTarget({ ...SAFE_INPUT, appEnv: 'staging' })).toThrow(
      /staging/,
    );
  });

  it('refuses mongodb+srv remote URIs', () => {
    expect(() =>
      assertSafePhase1DevSeedTarget({
        ...SAFE_INPUT,
        mongodbUri: 'mongodb+srv://cluster.example.com/dragon_local',
      }),
    ).toThrow(/mongodb\+srv/);
  });

  it('refuses non-local hosts', () => {
    expect(() =>
      assertSafePhase1DevSeedTarget({
        ...SAFE_INPUT,
        mongodbUri: 'mongodb://db.example.com:27017/dragon_local',
      }),
    ).toThrow(/not an approved local host/);
  });

  it('refuses production-looking database names', () => {
    expect(() =>
      assertSafePhase1DevSeedTarget({
        ...SAFE_INPUT,
        mongodbUri: 'mongodb://localhost:27017/dragon_production',
      }),
    ).toThrow(/production/);
  });
});
