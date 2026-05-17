import { Injectable } from '@nestjs/common';
import type { UserStatus, UserStatusState } from './user.types';

@Injectable()
export class UserService {
  isPendingVerification(user: UserStatusState | UserStatus): boolean {
    return this.getStatus(user) === 'pending_verification';
  }

  isActive(user: UserStatusState | UserStatus): boolean {
    return this.getStatus(user) === 'active';
  }

  isSuspended(user: UserStatusState | UserStatus): boolean {
    return this.getStatus(user) === 'suspended';
  }

  isBanned(user: UserStatusState | UserStatus): boolean {
    return this.getStatus(user) === 'banned';
  }

  isDeleted(user: UserStatusState | UserStatus): boolean {
    return this.getStatus(user) === 'deleted';
  }

  canAttemptLogin(user: UserStatusState, now = new Date()): boolean {
    return (
      this.isActive(user) && Boolean(user.phoneVerifiedAt) && !this.isTemporarilyLocked(user, now)
    );
  }

  canCompletePhoneVerification(user: UserStatusState, now = new Date()): boolean {
    return (
      this.isPendingVerification(user) &&
      !user.phoneVerifiedAt &&
      !this.isTemporarilyLocked(user, now)
    );
  }

  private isTemporarilyLocked(user: UserStatusState, now: Date): boolean {
    return Boolean(user.lockedUntil && user.lockedUntil.getTime() > now.getTime());
  }

  private getStatus(user: UserStatusState | UserStatus): UserStatus {
    return typeof user === 'string' ? user : user.status;
  }
}
