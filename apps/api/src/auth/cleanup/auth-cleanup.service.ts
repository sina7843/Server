import { Injectable } from '@nestjs/common';
import { OtpChallengeRepository } from '../otp/otp.repository';
import { SessionRepository } from '../sessions/session.repository';
import { UserRepository } from '../users/user.repository';
import type { AuthCleanupOptions, AuthCleanupResult } from './auth-cleanup.types';

const DEFAULT_PENDING_USER_CLEANUP_AFTER_HOURS = 24;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

@Injectable()
export class AuthCleanupService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpChallengeRepository: OtpChallengeRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async runAuthCleanup(options: AuthCleanupOptions = {}): Promise<AuthCleanupResult> {
    const now = options.now ?? new Date();
    const pendingUserCleanupAfterHours =
      options.pendingUserCleanupAfterHours ?? DEFAULT_PENDING_USER_CLEANUP_AFTER_HOURS;

    if (!Number.isInteger(pendingUserCleanupAfterHours) || pendingUserCleanupAfterHours <= 0) {
      throw new Error('Pending user cleanup threshold must be a positive integer.');
    }

    const pendingUserCutoff = new Date(
      now.getTime() - pendingUserCleanupAfterHours * MILLISECONDS_PER_HOUR,
    );

    const pendingUsersMarkedDeleted = await this.userRepository.markExpiredPendingUsersDeleted(
      pendingUserCutoff,
      now,
    );
    const expiredOtpChallengesCleaned =
      await this.otpChallengeRepository.markExpiredUnconsumedChallengesConsumed(now);
    const expiredSessionsMarkedExpired =
      await this.sessionRepository.markExpiredSessionsRevoked(now);

    return {
      pendingUsersMarkedDeleted,
      expiredOtpChallengesCleaned,
      expiredSessionsMarkedExpired,
    };
  }
}
