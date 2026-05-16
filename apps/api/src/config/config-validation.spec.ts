import {
  readEnumEnv,
  readPositiveIntegerEnv,
  readRequiredEnv,
  readStringWithMinLengthEnv,
} from './config-validation';

describe('config validation helpers', () => {
  it('reads required values', () => {
    expect(readRequiredEnv({ VALUE: ' present ' }, 'VALUE')).toBe('present');
  });

  it('fails when required values are missing', () => {
    expect(() => readRequiredEnv({}, 'VALUE')).toThrow('VALUE is required.');
  });

  it('parses positive integer values as numbers', () => {
    expect(readPositiveIntegerEnv({ VALUE: '42' }, 'VALUE')).toBe(42);
  });

  it('fails for invalid numeric values', () => {
    expect(() => readPositiveIntegerEnv({ VALUE: '0' }, 'VALUE')).toThrow(
      'VALUE must be a positive integer.',
    );
  });

  it('fails for numeric values outside configured ranges', () => {
    expect(() =>
      readPositiveIntegerEnv({ VALUE: '121' }, 'VALUE', { max: 120 }),
    ).toThrow('VALUE must be less than or equal to 120.');
  });

  it('validates minimum string length without exposing values', () => {
    expect(() =>
      readStringWithMinLengthEnv({ SECRET: 'short' }, 'SECRET', 32),
    ).toThrow('SECRET must be at least 32 characters long.');
  });

  it('rejects unsupported enum values', () => {
    expect(() =>
      readEnumEnv({ SMS_PROVIDER: 'unknown' }, 'SMS_PROVIDER', ['mock']),
    ).toThrow('SMS_PROVIDER has an unsupported value.');
  });
});
