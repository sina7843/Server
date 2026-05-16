export interface DatabaseConfig {
  readonly uri: string;
}

export type DatabaseEnv = Readonly<Record<string, string | undefined>>;

export function getDatabaseConfig(env: DatabaseEnv = process.env): DatabaseConfig {
  const uri = env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error('MONGODB_URI is required for the API database connection.');
  }

  return { uri };
}
