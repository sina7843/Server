export interface CorsConfig {
  readonly allowedOrigins: readonly string[];
}

export function getCorsConfig(env: NodeJS.ProcessEnv = process.env): CorsConfig {
  const raw = env['CORS_ALLOWED_ORIGINS'] ?? '';
  const allowedOrigins = raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0 && o !== '*');

  return { allowedOrigins };
}
