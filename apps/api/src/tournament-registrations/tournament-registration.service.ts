import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuditAction } from '@dragon/types';
import { AuditService } from '../audit/audit.service';
import { AnalyticsService } from '../analytics/analytics.service';
import type { TournamentDocument } from '../tournaments/tournament.schema';
import { TournamentRegistrationRepository } from './tournament-registration.repository';
import type { TournamentRegistrationDocument } from './tournament-registration.schema';
import type {
  RegistrationId,
  RegistrationTournamentId,
  UpdateRegistrationInput,
  RegistrationRepositoryPatch,
  RegistrationListFilter,
  RegistrationMemberInput,
} from './tournament-registration.types';
import {
  assertNoDuplicateBlocking,
  assertAdminTransition,
  assertUserWithdraw,
  assertParticipantTypeCompatible,
} from './tournament-registration-policy';
import {
  assertRegistrationType,
  assertTeamName,
  assertTeamMembers,
} from './tournament-registration-validation';

// ─── Service ──────────────────────────────────────────────────────────────────
//
// Public registration notifications (submitted/approved/rejected) are deferred
// to Slice 11. The NotificationService currently handles only transactional
// SMS for auth flows and does not support general registration notifications.
//
// Analytics: tournament.registration_started is a frontend event (user opens
// the registration form). tournament.registration_completed fires here on
// successful backend submission.

@Injectable()
export class TournamentRegistrationService {
  constructor(
    private readonly registrationRepository: TournamentRegistrationRepository,
    @Optional() private readonly auditService?: AuditService,
    @Optional() private readonly analyticsService?: AnalyticsService,
  ) {}

  // ─── Public: submit registration ──────────────────────────────────────────
  //
  // Accepts the already-fetched TournamentDocument from the public controller
  // (which has already validated public visibility). The service validates
  // registration-specific conditions.

  async register(
    tournament: TournamentDocument,
    userId: string,
    input: { type: unknown; teamName?: unknown; members?: unknown },
  ): Promise<TournamentRegistrationDocument> {
    assertRegistrationType(input.type);

    if (tournament.status !== 'registration_open') {
      throw new UnprocessableEntityException(
        'Tournament is not accepting registrations at this time.',
      );
    }

    this.assertRegistrationWindowOpen(tournament);
    assertParticipantTypeCompatible(tournament.participantType, input.type);

    const blockingReg = await this.registrationRepository.findBlockingRegistration(
      tournament._id,
      userId,
    );
    if (blockingReg) {
      assertNoDuplicateBlocking(blockingReg.status);
    }

    const activeCount = await this.registrationRepository.countActive(tournament._id);
    if (activeCount >= tournament.capacity) {
      throw new ConflictException('This tournament has reached its registration capacity.');
    }

    // Team registration requires teamName; individual registrations silently
    // ignore teamName/members (documented policy: strip, do not reject).
    let teamName: string | undefined;
    let members: RegistrationMemberInput[] | undefined;

    if (input.type === 'team') {
      assertTeamName(input.teamName);
      teamName = (input.teamName as string).trim();
      if (input.members !== undefined) {
        assertTeamMembers(input.members);
        members = input.members as RegistrationMemberInput[];
      }
    }

    const registration = await this.registrationRepository.create({
      tournamentId: tournament._id,
      userId,
      type: input.type,
      ...(teamName !== undefined ? { teamName } : {}),
      ...(members !== undefined ? { members } : {}),
    });

    void this.auditService?.log({
      actorId: userId,
      actorType: 'user',
      action: AuditAction.REGISTRATION_SUBMITTED,
      resourceType: 'tournament_registration',
      resourceId: String(registration._id),
      after: {
        tournamentId: String(tournament._id),
        type: registration.type,
        status: registration.status,
      },
      severity: 'info',
    });

    void this.analyticsService?.track({
      type: 'tournament.registration_completed',
      userId,
      resourceType: 'tournament',
      resourceId: String(tournament._id),
      metadata: { registrationId: String(registration._id), type: registration.type },
    });

    // Notification stub: notify user of registration submission (Slice 11).

    return registration;
  }

  // ─── Public: get my registration ──────────────────────────────────────────

  findMyRegistration(
    tournamentId: RegistrationTournamentId,
    userId: string,
  ): Promise<TournamentRegistrationDocument | null> {
    return this.registrationRepository.findByTournamentAndUser(tournamentId, userId);
  }

  // ─── Public: update my registration ───────────────────────────────────────
  //
  // Team data only — status changes are never allowed via public update.

  async updateMyRegistration(
    tournamentId: RegistrationTournamentId,
    userId: string,
    input: UpdateRegistrationInput,
  ): Promise<TournamentRegistrationDocument> {
    const registration = await this.registrationRepository.findByTournamentAndUser(
      tournamentId,
      userId,
    );
    if (!registration) throw new NotFoundException('Registration not found.');

    if (registration.status === 'withdrawn' || registration.status === 'cancelled') {
      throw new UnprocessableEntityException(
        'Cannot update a registration that is withdrawn or cancelled.',
      );
    }
    if (registration.type !== 'team') {
      throw new UnprocessableEntityException('Only team registrations can be updated.');
    }

    let teamNamePatch: string | undefined;
    let membersPatch: RegistrationMemberInput[] | undefined;

    if (input.teamName !== undefined) {
      assertTeamName(input.teamName);
      teamNamePatch = input.teamName.trim();
    }
    if (input.members !== undefined) {
      assertTeamMembers(input.members);
      membersPatch = input.members as RegistrationMemberInput[];
    }

    const patch: RegistrationRepositoryPatch = {
      ...(teamNamePatch !== undefined ? { teamName: teamNamePatch } : {}),
      ...(membersPatch !== undefined ? { members: membersPatch } : {}),
    };

    const updated = await this.registrationRepository.update(registration._id, patch);
    if (!updated) throw new NotFoundException('Registration not found.');

    void this.auditService?.log({
      actorId: userId,
      actorType: 'user',
      action: AuditAction.REGISTRATION_UPDATED,
      resourceType: 'tournament_registration',
      resourceId: String(registration._id),
      after: { teamName: updated.teamName, membersCount: updated.members?.length },
      severity: 'info',
    });

    return updated;
  }

  // ─── Public: withdraw ─────────────────────────────────────────────────────

  async withdraw(
    tournamentId: RegistrationTournamentId,
    userId: string,
  ): Promise<TournamentRegistrationDocument> {
    const registration = await this.registrationRepository.findByTournamentAndUser(
      tournamentId,
      userId,
    );
    if (!registration) throw new NotFoundException('Registration not found.');

    assertUserWithdraw(registration.status);

    const updated = await this.registrationRepository.update(registration._id, {
      status: 'withdrawn',
      withdrawnAt: new Date(),
    });
    if (!updated) throw new NotFoundException('Registration not found.');

    void this.auditService?.log({
      actorId: userId,
      actorType: 'user',
      action: AuditAction.REGISTRATION_WITHDRAWN,
      resourceType: 'tournament_registration',
      resourceId: String(registration._id),
      after: { status: 'withdrawn' },
      severity: 'info',
    });

    return updated;
  }

  // ─── Admin: list registrations ────────────────────────────────────────────

  listForTournament(
    tournamentId: RegistrationTournamentId,
    filter: Pick<RegistrationListFilter, 'status' | 'type'>,
    page?: number,
    limit?: number,
  ): Promise<{ items: TournamentRegistrationDocument[]; total: number }> {
    return this.registrationRepository.list({ tournamentId, ...filter }, page, limit);
  }

  // ─── Admin: get registration by ID ───────────────────────────────────────

  findById(id: RegistrationId): Promise<TournamentRegistrationDocument | null> {
    return this.registrationRepository.findById(id);
  }

  // ─── Admin: approve ───────────────────────────────────────────────────────

  async approve(
    registrationId: RegistrationId,
    adminUserId: string,
  ): Promise<TournamentRegistrationDocument> {
    const registration = await this.registrationRepository.findById(registrationId);
    if (!registration) throw new NotFoundException('Registration not found.');

    assertAdminTransition(registration.status, 'approved');

    const updated = await this.registrationRepository.update(registrationId, {
      status: 'approved',
      approvedAt: new Date(),
    });
    if (!updated) throw new NotFoundException('Registration not found.');

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.REGISTRATION_APPROVED,
      resourceType: 'tournament_registration',
      resourceId: String(registrationId),
      after: { status: 'approved' },
      severity: 'info',
    });

    // Notification stub: notify user of approval (Slice 11).

    return updated;
  }

  // ─── Admin: reject ────────────────────────────────────────────────────────

  async reject(
    registrationId: RegistrationId,
    adminUserId: string,
    reason?: string,
  ): Promise<TournamentRegistrationDocument> {
    const registration = await this.registrationRepository.findById(registrationId);
    if (!registration) throw new NotFoundException('Registration not found.');

    assertAdminTransition(registration.status, 'rejected');

    const rejectedReason =
      reason !== undefined && reason.trim().length > 0 ? reason.trim() : undefined;

    const updated = await this.registrationRepository.update(registrationId, {
      status: 'rejected',
      rejectedAt: new Date(),
      ...(rejectedReason !== undefined ? { rejectedReason } : {}),
    });
    if (!updated) throw new NotFoundException('Registration not found.');

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.REGISTRATION_REJECTED,
      resourceType: 'tournament_registration',
      resourceId: String(registrationId),
      after: { status: 'rejected', reason: reason ?? null },
      severity: 'info',
    });

    // Notification stub: notify user of rejection (Slice 11).

    return updated;
  }

  // ─── Admin: cancel ────────────────────────────────────────────────────────

  async cancel(
    registrationId: RegistrationId,
    adminUserId: string,
  ): Promise<TournamentRegistrationDocument> {
    const registration = await this.registrationRepository.findById(registrationId);
    if (!registration) throw new NotFoundException('Registration not found.');

    assertAdminTransition(registration.status, 'cancelled');

    const updated = await this.registrationRepository.update(registrationId, {
      status: 'cancelled',
      cancelledAt: new Date(),
    });
    if (!updated) throw new NotFoundException('Registration not found.');

    void this.auditService?.log({
      actorId: adminUserId,
      actorType: 'admin',
      action: AuditAction.REGISTRATION_CANCELLED,
      resourceType: 'tournament_registration',
      resourceId: String(registrationId),
      after: { status: 'cancelled' },
      severity: 'warning',
    });

    return updated;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private assertRegistrationWindowOpen(tournament: TournamentDocument): void {
    const now = new Date();
    if (tournament.registrationOpenAt != null && now < tournament.registrationOpenAt) {
      throw new UnprocessableEntityException('Registration has not opened yet.');
    }
    if (tournament.registrationCloseAt != null && now > tournament.registrationCloseAt) {
      throw new UnprocessableEntityException('Registration has closed.');
    }
  }
}
