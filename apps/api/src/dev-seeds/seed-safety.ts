export interface SeedSafetyInput {
  readonly mongodbUri: string | undefined;
  readonly nodeEnv: string | undefined;
  readonly appEnv: string | undefined;
  readonly allowReset?: string | undefined;
  readonly reset: boolean;
}

const ALLOWED_LOCAL_MONGO_HOSTS = new Set(['localhost', '127.0.0.1', 'mongo', 'mongodb']);
const BLOCKED_DB_NAME_PARTS = ['prod', 'production', 'stage', 'staging'];

export function assertSafePhase1DevSeedTarget(input: SeedSafetyInput): void {
  const nodeEnv = input.nodeEnv?.trim().toLowerCase();
  const appEnv = input.appEnv?.trim().toLowerCase();

  if (nodeEnv === 'production' || appEnv === 'production' || appEnv === 'staging') {
    throw new Error('Phase 1 dev seed refused: production/staging environment is not allowed.');
  }

  if (input.reset && input.allowReset !== 'true') {
    throw new Error(
      'Phase 1 dev seed reset refused: set DRAGON_ALLOW_SEED_RESET=true to reset local seed data.',
    );
  }

  const uri = input.mongodbUri?.trim();
  if (!uri) {
    throw new Error('Phase 1 dev seed refused: MONGODB_URI is required.');
  }

  if (uri.startsWith('mongodb+srv://')) {
    throw new Error('Phase 1 dev seed refused: mongodb+srv remote databases are not allowed.');
  }

  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error('Phase 1 dev seed refused: MONGODB_URI is not a valid MongoDB URI.');
  }

  if (parsed.protocol !== 'mongodb:') {
    throw new Error('Phase 1 dev seed refused: only mongodb:// local URIs are allowed.');
  }

  if (!ALLOWED_LOCAL_MONGO_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `Phase 1 dev seed refused: MongoDB host "${parsed.hostname}" is not an approved local host.`,
    );
  }

  const dbName = parsed.pathname.replace(/^\//, '').split('/')[0]?.toLowerCase() ?? '';
  if (!dbName) {
    throw new Error('Phase 1 dev seed refused: database name is required in MONGODB_URI.');
  }

  if (BLOCKED_DB_NAME_PARTS.some((blocked) => dbName.includes(blocked))) {
    throw new Error(
      `Phase 1 dev seed refused: database name "${dbName}" looks like production/staging.`,
    );
  }
}
