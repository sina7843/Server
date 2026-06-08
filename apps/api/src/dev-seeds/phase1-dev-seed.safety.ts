export interface Phase1DevSeedSafetyEnv {
  readonly [key: string]: string | undefined;
  readonly NODE_ENV?: string | undefined;
  readonly MONGODB_URI?: string | undefined;
  readonly DRAGON_ALLOW_SEED_RESET?: string | undefined;
}

const SAFE_NODE_ENVS = new Set(['development', 'test', 'local']);
const PRODUCTION_URI_PATTERN = /(?:^|[-_.:/@])prod(?:uction)?(?:[-_.:/@]|$)/i;

const LOCAL_TEST_AUTH_DEFAULTS: Readonly<Record<string, string>> = {
  AUTH_ACCESS_TOKEN_TTL_SECONDS: '900',
  AUTH_REFRESH_TOKEN_TTL_DAYS: '30',
  AUTH_PASSWORD_MIN_LENGTH: '8',
  AUTH_PASSWORD_RESET_TOKEN_TTL_SECONDS: '900',
  AUTH_OTP_TTL_SECONDS: '300',
  AUTH_OTP_MAX_ATTEMPTS: '5',
  AUTH_OTP_RESEND_COOLDOWN_SECONDS: '60',
  AUTH_OTP_DAILY_PHONE_LIMIT: '20',
  AUTH_OTP_IP_LIMIT: '100',
  AUTH_JWT_SECRET: 'phase1-dev-seed-local-jwt-secret-minimum-32-chars',
  SMS_PROVIDER: 'mock',
};

export function applyPhase1DevSeedRuntimeDefaults(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const nodeEnv = normalizeEnvName(env.NODE_ENV);

  if (nodeEnv === 'production') {
    return;
  }

  if (!env.NODE_ENV?.trim()) {
    env.NODE_ENV = 'development';
  }

  for (const [key, value] of Object.entries(LOCAL_TEST_AUTH_DEFAULTS)) {
    if (!env[key]?.trim()) {
      env[key] = value;
    }
  }
}

export function assertSafeSeedEnvironment(
  env: Phase1DevSeedSafetyEnv = process.env,
): void {
  const nodeEnv = normalizeEnvName(env.NODE_ENV);

  if (nodeEnv === 'production') {
    throw new Error('Refusing to run seed command because NODE_ENV=production.');
  }

  if (!isAllowedSeedEnvironment(nodeEnv)) {
    throw new Error(
      `Refusing to run seed command because NODE_ENV=${nodeEnv || '<empty>'}. Allowed values: development, test, local.`,
    );
  }

  const mongoUri = env.MONGODB_URI?.trim();

  if (!mongoUri) {
    throw new Error('MONGODB_URI is required for local/test seed commands.');
  }

  if (
    PRODUCTION_URI_PATTERN.test(mongoUri) ||
    mongoUri.toLowerCase().includes('mongodb+srv://')
  ) {
    throw new Error(
      'Refusing to run seed command because the database URI looks production-like.',
    );
  }
}

export function assertSafeSeedResetEnvironment(
  env: Phase1DevSeedSafetyEnv = process.env,
): void {
  assertSafeSeedEnvironment(env);

  if (env.DRAGON_ALLOW_SEED_RESET !== 'true') {
    throw new Error(
      'Refusing to reset seed data without DRAGON_ALLOW_SEED_RESET=true.',
    );
  }
}

function normalizeEnvName(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function isAllowedSeedEnvironment(nodeEnv: string): boolean {
  return SAFE_NODE_ENVS.has(nodeEnv);
}
