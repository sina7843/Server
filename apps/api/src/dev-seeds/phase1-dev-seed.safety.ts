export interface Phase1DevSeedSafetyEnv {
  readonly nodeEnv?: string | undefined;
  readonly mongodbUri?: string | undefined;
  readonly allowSeedReset?: string | undefined;
  // CI flag — used by command runners to suppress credential printing.
  // Not used by the safety assertion functions themselves.
  readonly ci?: string | undefined;
}

export function readPhase1DevSeedSafetyEnv(
  env: NodeJS.ProcessEnv = process.env,
): Phase1DevSeedSafetyEnv {
  return {
    nodeEnv: env.NODE_ENV,
    mongodbUri: env.MONGODB_URI,
    allowSeedReset: env.DRAGON_ALLOW_SEED_RESET,
    ci: env.CI,
  };
}

export function assertSafeSeedEnvironment(
  env: Phase1DevSeedSafetyEnv = readPhase1DevSeedSafetyEnv(),
): void {
  const nodeEnv = normalizeEnvName(env.nodeEnv);

  if (nodeEnv === 'production') {
    throw new Error(
      'Refusing to run Phase 1 development seed because NODE_ENV=production.',
    );
  }

  if (!isAllowedSeedEnvironment(nodeEnv)) {
    throw new Error(
      'Refusing to run Phase 1 development seed. Allowed NODE_ENV values are development, test, and local.',
    );
  }

  assertSafeDatabaseUri(env.mongodbUri, 'run Phase 1 development seed');
}

export function assertSafeSeedResetEnvironment(
  env: Phase1DevSeedSafetyEnv = readPhase1DevSeedSafetyEnv(),
): void {
  const nodeEnv = normalizeEnvName(env.nodeEnv);

  if (nodeEnv === 'production') {
    throw new Error(
      'Refusing to reset seed data because NODE_ENV=production. This command is allowed only in local/development/test environments.',
    );
  }

  if (!isAllowedSeedEnvironment(nodeEnv)) {
    throw new Error(
      'Refusing to reset seed data. Allowed NODE_ENV values are development, test, and local.',
    );
  }

  if (env.allowSeedReset !== 'true') {
    throw new Error(
      'Refusing to reset seed data. Set DRAGON_ALLOW_SEED_RESET=true to confirm this local/test cleanup.',
    );
  }

  assertSafeDatabaseUri(env.mongodbUri, 'reset Phase 1 development seed data');
}

function normalizeEnvName(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function isAllowedSeedEnvironment(nodeEnv: string): boolean {
  return nodeEnv === 'development' || nodeEnv === 'test' || nodeEnv === 'local';
}

// Hosts recognized as local Docker/dev instances.
// Remote/Atlas/staging hosts are not listed here and will be blocked.
// To allow a non-local host, an explicit HQ-approved env such as
// DRAGON_ALLOW_REMOTE_DEV_SEED=true would be required — not in scope for Phase 1.
const ALLOWED_SEED_HOSTS = new Set<string>([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'mongo',
  'mongodb',
  'db',
]);

// Matches production/staging/prod as whole words (word-boundary aware).
// Does NOT match "products", "reproduce", "protagonist" etc.
// Uses dash/underscore as implicit word boundaries since MongoDB URIs use them as separators.
const DANGEROUS_DB_NAME_PATTERN = /\b(production|staging|prod)\b/i;

function assertSafeDatabaseUri(
  mongodbUri: string | undefined,
  actionLabel: string,
): void {
  const uri = (mongodbUri ?? '').trim();

  if (!uri) {
    throw new Error(
      `Refusing to ${actionLabel} because MONGODB_URI is missing.`,
    );
  }

  // mongodb+srv:// indicates a remote/Atlas cluster — blocked under Docker-local-only policy.
  if (/^mongodb\+srv:\/\//i.test(uri)) {
    throw new Error(
      `Refusing to ${actionLabel} because MONGODB_URI uses mongodb+srv://, which indicates a remote or Atlas database. This command runs only against local Docker/dev instances.`,
    );
  }

  // Extract and validate the host component.
  const host = extractMongoHost(uri);
  if (!ALLOWED_SEED_HOSTS.has(host)) {
    throw new Error(
      `Refusing to ${actionLabel} because MONGODB_URI host "${host}" is not a recognized local Docker/dev host. Allowed hosts: ${[...ALLOWED_SEED_HOSTS].join(', ')}.`,
    );
  }

  // Block production/staging-looking database names (word-boundary check avoids false positives
  // like "products" or "reproduce").
  if (DANGEROUS_DB_NAME_PATTERN.test(uri)) {
    throw new Error(
      `Refusing to ${actionLabel} because MONGODB_URI looks like a production or staging database. This command runs only against local development databases.`,
    );
  }
}

function extractMongoHost(uri: string): string {
  // Strip protocol prefix.
  const withoutProtocol = uri.replace(/^mongodb:\/\//i, '');
  // Strip credentials (user:pass@host → host).
  const withoutCreds = withoutProtocol.includes('@')
    ? withoutProtocol.slice(withoutProtocol.indexOf('@') + 1)
    : withoutProtocol;
  // Host is everything up to the first colon (port), slash (db), or query string.
  const match = withoutCreds.match(/^([^/:?]+)/);
  return (match?.[1] ?? '').toLowerCase();
}
