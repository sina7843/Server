import { UserService } from './user.service';
import type { UserStatusState } from './user.types';

describe('UserService', () => {
  const service = new UserService();

  it('checks user status helpers', () => {
    expect(service.isPendingVerification('pending_verification')).toBe(true);
    expect(service.isActive('active')).toBe(true);
    expect(service.isSuspended('suspended')).toBe(true);
    expect(service.isBanned('banned')).toBe(true);
    expect(service.isDeleted('deleted')).toBe(true);
  });

  it('allows login only for active users that are not temporarily locked', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const rejectedStatuses: UserStatusState[] = [
      { status: 'pending_verification' },
      { status: 'suspended' },
      { status: 'banned' },
      { status: 'deleted' },
    ];

    expect(service.canAttemptLogin({ status: 'active' }, now)).toBe(true);

    for (const user of rejectedStatuses) {
      expect(service.canAttemptLogin(user, now)).toBe(false);
    }
  });

  it('rejects active login while locked', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const lockedUntil = new Date('2026-01-01T00:01:00.000Z');

    expect(service.canAttemptLogin({ status: 'active', lockedUntil }, now)).toBe(false);
  });

  it('allows phone verification only for pending users without an existing verification date', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');

    expect(service.canCompletePhoneVerification({ status: 'pending_verification' }, now)).toBe(
      true,
    );
    expect(service.canCompletePhoneVerification({ status: 'active' }, now)).toBe(false);
    expect(
      service.canCompletePhoneVerification(
        {
          status: 'pending_verification',
          phoneVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        now,
      ),
    ).toBe(false);
  });
});
