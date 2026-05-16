import { SessionService } from './session.service';

const NOW = new Date('2026-01-01T00:00:00.000Z');

describe('SessionService', () => {
  const service = new SessionService();

  it('marks expired sessions as inactive', () => {
    const session = { expiresAt: new Date('2025-12-31T23:59:59.000Z') };

    expect(service.isExpired(session, NOW)).toBe(true);
    expect(service.isActive(session, NOW)).toBe(false);
  });

  it('marks revoked sessions as inactive', () => {
    const session = {
      expiresAt: new Date('2026-01-01T00:05:00.000Z'),
      revokedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    expect(service.isRevoked(session)).toBe(true);
    expect(service.isActive(session, NOW)).toBe(false);
  });

  it('marks future-dated non-revoked sessions as active', () => {
    const session = { expiresAt: new Date('2026-01-01T00:05:00.000Z') };

    expect(service.isActive(session, NOW)).toBe(true);
    expect(service.canUseSession(session, NOW)).toBe(true);
  });

  it('throws when asserting an inactive session', () => {
    const session = { expiresAt: new Date('2025-12-31T23:59:59.000Z') };

    expect(() => service.assertActiveSession(session, NOW)).toThrow('Session is not active.');
  });
});
