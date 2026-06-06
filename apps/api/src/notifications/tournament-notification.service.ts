import { Injectable, Logger, Optional } from '@nestjs/common';
import { SmsService } from '../auth/sms/sms.service';
import { UserRepository } from '../auth/users/user.repository';
import type { TournamentRegistrationDocument } from '../tournament-registrations/tournament-registration.schema';

// ─── Purpose constants ────────────────────────────────────────────────────────

export const NOTIF_PURPOSE_REGISTRATION_SUBMITTED = 'registration.submitted';
export const NOTIF_PURPOSE_REGISTRATION_APPROVED = 'registration.approved';
export const NOTIF_PURPOSE_REGISTRATION_REJECTED = 'registration.rejected';
export const NOTIF_PURPOSE_REGISTRATION_WITHDRAWN = 'registration.withdrawn';
export const NOTIF_PURPOSE_REGISTRATION_CANCELLED = 'registration.cancelled';
export const NOTIF_PURPOSE_TOURNAMENT_CANCELLED = 'tournament.cancelled';

// ─── Static message table ─────────────────────────────────────────────────────
//
// Phase 1 fallback messages used when no template is seeded in the database.
// Production deployments would replace these with template-driven content via
// NotificationTemplate records. No marketing copy. No campaign tags.

const STATIC_MESSAGES: Record<string, string> = {
  [NOTIF_PURPOSE_REGISTRATION_SUBMITTED]: 'Your tournament registration has been received.',
  [NOTIF_PURPOSE_REGISTRATION_APPROVED]: 'Your tournament registration has been approved.',
  [NOTIF_PURPOSE_REGISTRATION_REJECTED]: 'Your tournament registration was not approved.',
  [NOTIF_PURPOSE_REGISTRATION_WITHDRAWN]: 'Your tournament registration withdrawal is confirmed.',
  [NOTIF_PURPOSE_REGISTRATION_CANCELLED]: 'Your tournament registration has been cancelled.',
  [NOTIF_PURPOSE_TOURNAMENT_CANCELLED]: 'A tournament you registered for has been cancelled.',
};

// ─── Notifiable registration statuses for tournament-cancelled notification ───
//
// Only notify registrants whose registration was active at time of cancellation.
// Terminal statuses (withdrawn, cancelled, rejected) are excluded.

const TOURNAMENT_CANCELLED_NOTIFIABLE_STATUSES = new Set(['submitted', 'approved', 'waitlisted']);

// ─── Service ──────────────────────────────────────────────────────────────────
//
// Handles transactional notifications for Phase 1 tournament domain events.
//
// Scope: registration submitted, approved, rejected, withdrawn, cancelled;
//        tournament cancelled.
//
// Recipient contact is resolved exclusively from trusted backend data
// (UserRepository). No phone/email from public route params or
// client-controlled payloads is ever used here.
//
// Privacy: phone numbers are never logged. SmsService masks/hashes before
// storage in the notification log. Errors are caught and logged as warnings
// only — notification failure never aborts the main business operation.
//
// Provider: uses the existing SmsService abstraction. Phase 1 only has the
// mock provider configured (smsProvider: 'mock'). No real SMS is delivered.
// When a production SMS provider is configured, this service will deliver
// through it automatically without code changes.

@Injectable()
export class TournamentNotificationService {
  private readonly logger = new Logger(TournamentNotificationService.name);

  constructor(
    @Optional() private readonly smsService?: SmsService,
    @Optional() private readonly userRepository?: UserRepository,
  ) {}

  // ─── Registration event hooks ──────────────────────────────────────────────

  async notifyRegistrationSubmitted(registration: TournamentRegistrationDocument): Promise<void> {
    await this.notifyRegistrant(registration.userId, NOTIF_PURPOSE_REGISTRATION_SUBMITTED);
  }

  async notifyRegistrationApproved(registration: TournamentRegistrationDocument): Promise<void> {
    await this.notifyRegistrant(registration.userId, NOTIF_PURPOSE_REGISTRATION_APPROVED);
  }

  async notifyRegistrationRejected(registration: TournamentRegistrationDocument): Promise<void> {
    await this.notifyRegistrant(registration.userId, NOTIF_PURPOSE_REGISTRATION_REJECTED);
  }

  async notifyRegistrationWithdrawn(registration: TournamentRegistrationDocument): Promise<void> {
    await this.notifyRegistrant(registration.userId, NOTIF_PURPOSE_REGISTRATION_WITHDRAWN);
  }

  async notifyRegistrationCancelled(registration: TournamentRegistrationDocument): Promise<void> {
    await this.notifyRegistrant(registration.userId, NOTIF_PURPOSE_REGISTRATION_CANCELLED);
  }

  // ─── Tournament cancelled ─────────────────────────────────────────────────
  //
  // Notifies a batch of userIds whose registrations were active at the time the
  // tournament was cancelled. The caller is responsible for filtering to only
  // notifiable statuses (submitted, approved, waitlisted).
  //
  // Known limitation: the registration repository list() method is capped at
  // 100 items per page. For Phase 1 tournaments this covers all registrants.
  // Large-scale tournaments would require cursor-based enumeration (deferred).

  async notifyUsersOfTournamentCancelled(userIds: readonly string[]): Promise<void> {
    if (!this.smsService || !this.userRepository) return;
    for (const userId of userIds) {
      await this.notifyRegistrant(userId, NOTIF_PURPOSE_TOURNAMENT_CANCELLED);
    }
  }

  // ─── Notifiable status filter ─────────────────────────────────────────────
  //
  // Exposed for use by callers enumerating registrations before calling
  // notifyUsersOfTournamentCancelled. Pure function — no side effects.

  isNotifiableForTournamentCancellation(status: string): boolean {
    return TOURNAMENT_CANCELLED_NOTIFIABLE_STATUSES.has(status);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async notifyRegistrant(userId: string, purpose: string): Promise<void> {
    if (!this.smsService || !this.userRepository) return;

    let phoneNormalized: string | undefined;
    try {
      const user = await this.userRepository.findById(userId);
      phoneNormalized = user?.phoneNormalized;
    } catch {
      this.logger.warn(
        `TournamentNotificationService: recipient lookup failed for purpose=${purpose}`,
      );
      return;
    }

    if (!phoneNormalized) {
      return;
    }

    try {
      await this.smsService.sendSms({
        recipientPhoneNormalized: phoneNormalized,
        message: STATIC_MESSAGES[purpose] ?? 'Tournament notification.',
        purpose,
      });
    } catch {
      this.logger.warn(`TournamentNotificationService: SMS delivery failed for purpose=${purpose}`);
    }
  }
}
