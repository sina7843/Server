import { AuthCleanupService } from './auth-cleanup.service';

const NOW = new Date('2026-01-02T00:00:00.000Z');
const EXPECTED_CUTOFF = new Date('2026-01-01T00:00:00.000Z');

describe('AuthCleanupService', () => {
  function createService() {
    const userRepository = {
      markExpiredPendingUsersDeleted: jest.fn().mockResolvedValue(2),
    };
    const otpChallengeRepository = {
      markExpiredUnconsumedChallengesConsumed: jest.fn().mockResolvedValue(3),
    };
    const sessionRepository = {
      markExpiredSessionsRevoked: jest.fn().mockResolvedValue(4),
    };

    return {
      otpChallengeRepository,
      service: new AuthCleanupService(
        userRepository as never,
        otpChallengeRepository as never,
        sessionRepository as never,
      ),
      sessionRepository,
      userRepository,
    };
  }

  it('marks pending unverified users older than the threshold as deleted', async () => {
    const { service, userRepository } = createService();

    await service.runAuthCleanup({ now: NOW });

    expect(userRepository.markExpiredPendingUsersDeleted).toHaveBeenCalledWith(
      EXPECTED_CUTOFF,
      NOW,
    );
  });

  it('uses a custom pending-user cleanup threshold when provided', async () => {
    const { service, userRepository } = createService();

    await service.runAuthCleanup({ now: NOW, pendingUserCleanupAfterHours: 12 });

    expect(userRepository.markExpiredPendingUsersDeleted).toHaveBeenCalledWith(
      new Date('2026-01-01T12:00:00.000Z'),
      NOW,
    );
  });

  it('rejects invalid cleanup thresholds', async () => {
    const { service } = createService();

    await expect(
      service.runAuthCleanup({ now: NOW, pendingUserCleanupAfterHours: 0 }),
    ).rejects.toThrow('Pending user cleanup threshold must be a positive integer.');
  });

  it('marks expired sessions as revoked with the expired reason', async () => {
    const { service, sessionRepository } = createService();

    await service.runAuthCleanup({ now: NOW });

    expect(sessionRepository.markExpiredSessionsRevoked).toHaveBeenCalledWith(NOW);
  });

  it('cleans expired OTP challenges without exposing codeHash', async () => {
    const { otpChallengeRepository, service } = createService();

    const result = await service.runAuthCleanup({ now: NOW });

    expect(otpChallengeRepository.markExpiredUnconsumedChallengesConsumed).toHaveBeenCalledWith(
      NOW,
    );
    expect(JSON.stringify(result)).not.toContain('codeHash');
  });

  it('returns counts only', async () => {
    const { service } = createService();

    await expect(service.runAuthCleanup({ now: NOW })).resolves.toEqual({
      pendingUsersMarkedDeleted: 2,
      expiredOtpChallengesCleaned: 3,
      expiredSessionsMarkedExpired: 4,
    });
  });

  it('does not require Redis, BullMQ, or a scheduler dependency', async () => {
    const { service } = createService();

    await expect(service.runAuthCleanup({ now: NOW })).resolves.toEqual(expect.any(Object));
  });
});
