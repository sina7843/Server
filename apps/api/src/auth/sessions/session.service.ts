import { Injectable } from '@nestjs/common';
import type { SessionState } from './session.types';

@Injectable()
export class SessionService {
  isExpired(session: SessionState, now = new Date()): boolean {
    return session.expiresAt.getTime() <= now.getTime();
  }

  isRevoked(session: SessionState): boolean {
    return Boolean(session.revokedAt);
  }

  isActive(session: SessionState, now = new Date()): boolean {
    return !this.isRevoked(session) && !this.isExpired(session, now);
  }

  canUseSession(session: SessionState, now = new Date()): boolean {
    return this.isActive(session, now);
  }

  assertActiveSession(session: SessionState, now = new Date()): void {
    if (!this.canUseSession(session, now)) {
      throw new Error('Session is not active.');
    }
  }
}
