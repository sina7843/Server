import { getBullMQConfig } from './redis.config';

describe('getBullMQConfig', () => {
  it('returns defaults when env vars are not set', () => {
    const config = getBullMQConfig({});
    expect(config.redis.host).toBe('localhost');
    expect(config.redis.port).toBe(6379);
    expect(config.redis.password).toBeUndefined();
    expect(config.redis.db).toBe(0);
    expect(config.defaultAttempts).toBe(3);
    expect(config.defaultBackoffMs).toBe(2000);
    expect(config.prefix).toBe('dragon');
  });

  it('reads REDIS_HOST', () => {
    const config = getBullMQConfig({ REDIS_HOST: 'redis.internal' });
    expect(config.redis.host).toBe('redis.internal');
  });

  it('reads REDIS_PORT', () => {
    const config = getBullMQConfig({ REDIS_PORT: '6380' });
    expect(config.redis.port).toBe(6380);
  });

  it('reads REDIS_PASSWORD', () => {
    const config = getBullMQConfig({ REDIS_PASSWORD: 'secret' });
    expect(config.redis.password).toBe('secret');
  });

  it('sets password to undefined when REDIS_PASSWORD is empty', () => {
    const config = getBullMQConfig({ REDIS_PASSWORD: '' });
    expect(config.redis.password).toBeUndefined();
  });

  it('reads REDIS_DB as non-negative integer', () => {
    const config = getBullMQConfig({ REDIS_DB: '2' });
    expect(config.redis.db).toBe(2);
  });

  it('accepts REDIS_DB of 0', () => {
    const config = getBullMQConfig({ REDIS_DB: '0' });
    expect(config.redis.db).toBe(0);
  });

  it('reads BULLMQ_DEFAULT_ATTEMPTS', () => {
    const config = getBullMQConfig({ BULLMQ_DEFAULT_ATTEMPTS: '5' });
    expect(config.defaultAttempts).toBe(5);
  });

  it('reads BULLMQ_DEFAULT_BACKOFF_MS', () => {
    const config = getBullMQConfig({ BULLMQ_DEFAULT_BACKOFF_MS: '5000' });
    expect(config.defaultBackoffMs).toBe(5000);
  });

  it('reads BULLMQ_PREFIX', () => {
    const config = getBullMQConfig({ BULLMQ_PREFIX: 'myapp' });
    expect(config.prefix).toBe('myapp');
  });

  it('throws on non-integer REDIS_PORT', () => {
    expect(() => getBullMQConfig({ REDIS_PORT: 'not-a-number' })).toThrow(
      'REDIS_PORT must be a positive integer',
    );
  });

  it('throws on non-positive REDIS_PORT', () => {
    expect(() => getBullMQConfig({ REDIS_PORT: '0' })).toThrow(
      'REDIS_PORT must be a positive integer',
    );
  });

  it('throws on negative REDIS_DB', () => {
    expect(() => getBullMQConfig({ REDIS_DB: '-1' })).toThrow(
      'REDIS_DB must be a non-negative integer',
    );
  });

  it('throws on non-positive BULLMQ_DEFAULT_ATTEMPTS', () => {
    expect(() => getBullMQConfig({ BULLMQ_DEFAULT_ATTEMPTS: '0' })).toThrow(
      'BULLMQ_DEFAULT_ATTEMPTS must be a positive integer',
    );
  });
});
