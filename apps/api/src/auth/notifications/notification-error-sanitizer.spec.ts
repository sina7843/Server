import { sanitizeNotificationErrorMessage } from './notification-error-sanitizer';

describe('sanitizeNotificationErrorMessage', () => {
  it('replaces message containing "token" with generic message', () => {
    expect(sanitizeNotificationErrorMessage('Invalid token provided')).toBe(
      'Provider error occurred.',
    );
  });

  it('replaces message containing "secret" with generic message', () => {
    expect(sanitizeNotificationErrorMessage('Secret key mismatch')).toBe(
      'Provider error occurred.',
    );
  });

  it('replaces message containing "password" with generic message', () => {
    expect(sanitizeNotificationErrorMessage('Wrong password')).toBe('Provider error occurred.');
  });

  it('replaces message containing "otp" with generic message', () => {
    expect(sanitizeNotificationErrorMessage('OTP expired')).toBe('Provider error occurred.');
  });

  it('replaces message containing "credential" with generic message', () => {
    expect(sanitizeNotificationErrorMessage('Bad credential')).toBe('Provider error occurred.');
  });

  it('replaces message containing "authorization" with generic message', () => {
    expect(sanitizeNotificationErrorMessage('Authorization header missing')).toBe(
      'Provider error occurred.',
    );
  });

  it('replaces message containing "cookie" with generic message', () => {
    expect(sanitizeNotificationErrorMessage('Cookie session invalid')).toBe(
      'Provider error occurred.',
    );
  });

  it('allows safe non-sensitive error messages through', () => {
    expect(sanitizeNotificationErrorMessage('Request timed out.')).toBe('Request timed out.');
  });

  it('truncates safe messages to 500 characters', () => {
    const long = 'a'.repeat(600);
    const result = sanitizeNotificationErrorMessage(long);
    expect(result.length).toBe(500);
  });

  it('does not expose raw OTP in output', () => {
    const result = sanitizeNotificationErrorMessage('Code 123456 is invalid OTP');
    expect(result).not.toContain('123456');
    expect(result).toBe('Provider error occurred.');
  });

  it('is case-insensitive for sensitive patterns', () => {
    expect(sanitizeNotificationErrorMessage('TOKEN expired')).toBe('Provider error occurred.');
    expect(sanitizeNotificationErrorMessage('SECRET mismatch')).toBe('Provider error occurred.');
  });
});
