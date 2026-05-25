import { getCorsConfig } from './cors.config';

describe('getCorsConfig', () => {
  it('returns empty allowedOrigins when env var is not set', () => {
    const config = getCorsConfig({});
    expect(config.allowedOrigins).toHaveLength(0);
  });

  it('returns empty allowedOrigins when env var is an empty string', () => {
    const config = getCorsConfig({ CORS_ALLOWED_ORIGINS: '' });
    expect(config.allowedOrigins).toHaveLength(0);
  });

  it('parses a single origin', () => {
    const config = getCorsConfig({ CORS_ALLOWED_ORIGINS: 'https://example.com' });
    expect(config.allowedOrigins).toEqual(['https://example.com']);
  });

  it('parses multiple comma-separated origins', () => {
    const config = getCorsConfig({
      CORS_ALLOWED_ORIGINS: 'https://app.example.com,https://admin.example.com',
    });
    expect(config.allowedOrigins).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('trims whitespace around each origin', () => {
    const config = getCorsConfig({
      CORS_ALLOWED_ORIGINS: ' https://app.example.com , https://admin.example.com ',
    });
    expect(config.allowedOrigins).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('strips wildcard * from allowed origins (no wildcard with credentials)', () => {
    const config = getCorsConfig({ CORS_ALLOWED_ORIGINS: '*' });
    expect(config.allowedOrigins).toHaveLength(0);
  });

  it('strips wildcard when mixed with real origins', () => {
    const config = getCorsConfig({
      CORS_ALLOWED_ORIGINS: '*, https://app.example.com',
    });
    expect(config.allowedOrigins).toEqual(['https://app.example.com']);
  });

  it('filters out empty segments from extra commas', () => {
    const config = getCorsConfig({
      CORS_ALLOWED_ORIGINS: ',https://app.example.com,,',
    });
    expect(config.allowedOrigins).toEqual(['https://app.example.com']);
  });
});
