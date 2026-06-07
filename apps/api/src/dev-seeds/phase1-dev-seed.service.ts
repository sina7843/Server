import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { normalizePhoneNumber } from '../auth/security/phone-normalizer';
import { hashPassword } from '../auth/security/password-hasher';
import { RbacSeedService } from '../rbac/seeds/rbac-seed.service';
import {
  PHASE1_DEV_SEED_ACCOUNTS,
  PHASE1_DEV_SEED_BATCH,
  PHASE1_DEV_SEED_GAMES,
  PHASE1_DEV_SEED_PASSWORD,
  PHASE1_DEV_SEED_SOURCE,
} from './phase1-dev-seed.constants';
import { assertSafeSeedEnvironment, assertSafeSeedResetEnvironment } from './phase1-dev-seed.safety';
import type { Phase1DevSeedResetResult, Phase1DevSeedResult } from './phase1-dev-seed.types';

type MongoCollection = ReturnType<NonNullable<Connection['db']>['collection']>;
type MongoDocument = Record<string, unknown> & { _id: Types.ObjectId };
type SeedDocument = MongoDocument;
type MongoFilter = Record<string, unknown>;
type UpsertResult = { readonly document: MongoDocument; readonly created: boolean; readonly updated: boolean };

@Injectable()
export class Phase1DevSeedService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly rbacSeedService: RbacSeedService,
  ) {}

  async runSeed(): Promise<Phase1DevSeedResult> {
    assertSafeSeedEnvironment();

    await this.rbacSeedService.runRbacSeed();

    const now = new Date();
    // Allow env override so developers can change the seed password without rebuilding.
    const seedPassword = process.env.DRAGON_DEV_SEED_PASSWORD ?? PHASE1_DEV_SEED_PASSWORD;
    const passwordHash = await hashPassword(seedPassword);
    const skipped: string[] = [];

    const roleIdsByKey = await this.loadRoleIdsByKey();

    const users = await this.seedUsers(now, passwordHash, roleIdsByKey, skipped);
    const profiles = await this.seedProfiles(now, users.documentsByKey, skipped);
    const userRoles = await this.seedUserRoles(now, users.documentsByKey, roleIdsByKey, skipped);
    const games = await this.seedGames(now, skipped);
    const tournaments = await this.seedTournaments(now, games.documentsByKey, skipped);
    const registrations = await this.seedRegistrations(now, users.documentsByKey, tournaments.documentsByKey, skipped);
    const matches = await this.seedMatches(now, tournaments.documentsByKey, registrations.documentsByKey, skipped);
    const notificationLogs = await this.seedNotificationLogs(now, users.documentsByKey, skipped);

    return {
      usersCreated: users.created,
      usersUpdated: users.updated,
      profilesCreated: profiles.created,
      profilesUpdated: profiles.updated,
      userRolesAttached: userRoles.created,
      gamesCreated: games.created,
      gamesUpdated: games.updated,
      tournamentsCreated: tournaments.created,
      tournamentsUpdated: tournaments.updated,
      registrationsCreated: registrations.created,
      registrationsUpdated: registrations.updated,
      matchesCreated: matches.created,
      matchesUpdated: matches.updated,
      notificationLogsCreated: notificationLogs.created,
      notificationLogsUpdated: notificationLogs.updated,
      skipped,
    };
  }

  async resetSeed(): Promise<Phase1DevSeedResetResult> {
    assertSafeSeedResetEnvironment();

    const users = this.collection('users');
    const profiles = this.collection('user_profiles');
    const userRoles = this.collection('user_roles');
    const games = this.collection('games');
    const tournaments = this.collection('tournaments');
    const registrations = this.collection('tournament_registrations');
    const matches = this.collection('tournament_matches');
    const notificationLogs = this.collection('notification_logs');

    const seedUsers = await users
      .find({ 'metadata.registrationSource': PHASE1_DEV_SEED_SOURCE }, { projection: { _id: 1 } })
      .toArray();
    const seedUserIds = seedUsers.map((user) => user._id);
    const seedUserIdStrings = seedUserIds.map(String);

    const seedTournaments = await tournaments
      .find(seedFilter(), { projection: { _id: 1 } })
      .toArray();
    const seedTournamentIds = seedTournaments.map((tournament) => tournament._id);

    // All seed records carry seedSource/seedBatch markers (set by upsertSeedDocument).
    // Child collections also include userId/tournamentId fallbacks so that records
    // created before the marker was introduced are still cleaned up.
    //
    // Deletion uses seedFilter() as the primary key so that reset is idempotent:
    // even if a previous reset was interrupted and parent records (users/tournaments)
    // were already deleted, the marker-based queries still find and delete child records.
    //
    // userRoles uses both ObjectId and string userId forms as secondary fallbacks to
    // handle any legacy seed data where userId may have been stored in either format.
    const [notificationResult, matchResult, registrationResult, userRoleResult, profileResult, tournamentResult, gameResult, userResult] = await Promise.all([
      notificationLogs.deleteMany(seedFilter()),
      matches.deleteMany({ $or: [seedFilter(), { tournamentId: { $in: seedTournamentIds } }] }),
      registrations.deleteMany({
        $or: [seedFilter(), { tournamentId: { $in: seedTournamentIds } }, { userId: { $in: seedUserIdStrings } }],
      }),
      userRoles.deleteMany({
        $or: [
          seedFilter(),
          // ObjectId form — matches records seeded with userId: user._id (ObjectId).
          { userId: { $in: seedUserIds } },
          // String form — matches any records where userId was stored as a string.
          { userId: { $in: seedUserIdStrings } },
        ],
      }),
      profiles.deleteMany({ $or: [seedFilter(), { userId: { $in: seedUserIds } }] }),
      tournaments.deleteMany(seedFilter()),
      games.deleteMany(seedFilter()),
      users.deleteMany({ 'metadata.registrationSource': PHASE1_DEV_SEED_SOURCE }),
    ]);

    return {
      usersDeleted: userResult.deletedCount ?? 0,
      profilesDeleted: profileResult.deletedCount ?? 0,
      userRolesDeleted: userRoleResult.deletedCount ?? 0,
      gamesDeleted: gameResult.deletedCount ?? 0,
      tournamentsDeleted: tournamentResult.deletedCount ?? 0,
      registrationsDeleted: registrationResult.deletedCount ?? 0,
      matchesDeleted: matchResult.deletedCount ?? 0,
      notificationLogsDeleted: notificationResult.deletedCount ?? 0,
    };
  }

  private async seedUsers(
    now: Date,
    passwordHash: string,
    roleIdsByKey: ReadonlyMap<string, Types.ObjectId>,
    skipped: string[],
  ): Promise<SeedBatchResult> {
    const documentsByKey = new Map<string, SeedDocument>();
    let created = 0;
    let updated = 0;

    for (const account of PHASE1_DEV_SEED_ACCOUNTS) {
      if (!roleIdsByKey.has(account.roleKey)) {
        skipped.push(`missing-role:${account.roleKey}`);
      }

      const phoneNormalized = normalizePhoneNumber(account.phone);
      const emailNormalized = account.email.toLowerCase();
      const existing = await this.collection('users').findOne({ phoneNormalized });
      this.assertDocumentCanBeSeedUpdated(existing, 'user', phoneNormalized);

      const result = await this.upsertSeedDocument(this.collection('users'), { phoneNormalized }, {
        phone: account.phone,
        phoneNormalized,
        email: account.email,
        emailNormalized,
        passwordHash,
        status: 'active',
        phoneVerifiedAt: now,
        emailVerifiedAt: now,
        failedLoginCount: 0,
        metadata: {
          registrationSource: PHASE1_DEV_SEED_SOURCE,
          locale: 'en-US',
        },
        lastLoginAt: undefined,
        lockedUntil: undefined,
      }, now);

      if (result.created) created += 1;
      if (result.updated) updated += 1;
      documentsByKey.set(account.key, result.document as SeedDocument);
    }

    return { created, updated, documentsByKey };
  }

  private async seedProfiles(
    now: Date,
    usersByKey: ReadonlyMap<string, SeedDocument>,
    skipped: string[],
  ): Promise<SeedBatchResult> {
    const documentsByKey = new Map<string, SeedDocument>();
    let created = 0;
    let updated = 0;

    for (const account of PHASE1_DEV_SEED_ACCOUNTS) {
      const user = usersByKey.get(account.key);
      if (!user) {
        skipped.push(`missing-user-for-profile:${account.key}`);
        continue;
      }

      const usernameNormalized = account.username.toLowerCase();
      const conflicting = await this.collection('user_profiles').findOne({ usernameNormalized });
      if (conflicting && String(conflicting.userId) !== String(user._id)) {
        this.assertDocumentCanBeSeedUpdated(conflicting, 'profile', usernameNormalized);
      }

      const result = await this.upsertSeedDocument(this.collection('user_profiles'), { userId: user._id }, {
        userId: user._id,
        username: account.username,
        usernameNormalized,
        displayName: account.displayName,
        bio: `${account.label} local development profile.`,
        visibility: 'public',
        publicUrl: `/u/${usernameNormalized}`,
      }, now);

      if (result.created) created += 1;
      if (result.updated) updated += 1;
      documentsByKey.set(account.key, result.document as SeedDocument);
    }

    return { created, updated, documentsByKey };
  }

  private async seedUserRoles(
    now: Date,
    usersByKey: ReadonlyMap<string, SeedDocument>,
    roleIdsByKey: ReadonlyMap<string, Types.ObjectId>,
    skipped: string[],
  ): Promise<SeedBatchResult> {
    let created = 0;
    let updated = 0;
    const documentsByKey = new Map<string, SeedDocument>();

    for (const account of PHASE1_DEV_SEED_ACCOUNTS) {
      const user = usersByKey.get(account.key);
      const roleId = roleIdsByKey.get(account.roleKey);
      if (!user || !roleId) {
        skipped.push(`missing-user-role-assignment:${account.key}:${account.roleKey}`);
        continue;
      }

      const result = await this.upsertSeedDocument(this.collection('user_roles'), {
        userId: user._id,
        roleId,
        scopeType: { $exists: false },
        scopeId: { $exists: false },
      }, {
        userId: user._id,
        roleId,
        assignedAt: now,
      }, now);

      if (result.created) created += 1;
      if (result.updated) updated += 1;
      documentsByKey.set(`${account.key}:${account.roleKey}`, result.document as SeedDocument);
    }

    return { created, updated, documentsByKey };
  }

  private async seedGames(now: Date, skipped: string[]): Promise<SeedBatchResult> {
    const documentsByKey = new Map<string, SeedDocument>();
    let created = 0;
    let updated = 0;

    for (const game of PHASE1_DEV_SEED_GAMES) {
      const existing = await this.collection('games').findOne({ slugNormalized: game.slug });
      this.assertDocumentCanBeSeedUpdated(existing, 'game', game.slug);

      const result = await this.upsertSeedDocument(this.collection('games'), { slugNormalized: game.slug }, {
        name: game.name,
        slug: game.slug,
        slugNormalized: game.slug,
        description: game.description,
        status: 'active',
      }, now);

      if (result.created) created += 1;
      if (result.updated) updated += 1;
      documentsByKey.set(game.key, result.document as SeedDocument);
    }

    if (documentsByKey.size === 0) skipped.push('games:none-seeded');

    return { created, updated, documentsByKey };
  }

  private async seedTournaments(
    now: Date,
    gamesByKey: ReadonlyMap<string, SeedDocument>,
    skipped: string[],
  ): Promise<SeedBatchResult> {
    const documentsByKey = new Map<string, SeedDocument>();
    let created = 0;
    let updated = 0;
    const day = 24 * 60 * 60 * 1000;

    const tournamentSeed = [
      {
        key: 'draft-valorant',
        gameKey: 'valorant',
        title: 'Phase 1 Dev Draft Valorant Cup',
        slug: 'phase1-dev-draft-valorant-cup',
        description: 'Draft local tournament for admin editing flow.',
        format: 'single_elimination',
        status: 'draft',
        capacity: 8,
        startsAt: new Date(now.getTime() + 14 * day),
      },
      {
        key: 'published-cs2',
        gameKey: 'counter-strike-2',
        title: 'Phase 1 Dev Published CS2 Open',
        slug: 'phase1-dev-published-cs2-open',
        description: 'Published local tournament before registration opens.',
        format: 'manual',
        status: 'published',
        capacity: 16,
        publishedAt: now,
        startsAt: new Date(now.getTime() + 21 * day),
      },
      {
        key: 'open-valorant',
        gameKey: 'valorant',
        title: 'Phase 1 Dev Registration Open Valorant Clash',
        slug: 'phase1-dev-registration-open-valorant-clash',
        description: 'Registration-open seed tournament for public search and registration flow.',
        format: 'single_elimination',
        status: 'registration_open',
        capacity: 8,
        publishedAt: new Date(now.getTime() - 2 * day),
        registrationOpenAt: new Date(now.getTime() - day),
        registrationCloseAt: new Date(now.getTime() + 7 * day),
        startsAt: new Date(now.getTime() + 9 * day),
      },
      {
        key: 'closed-eafc',
        gameKey: 'ea-fc',
        title: 'Phase 1 Dev Registration Closed EA FC League',
        slug: 'phase1-dev-registration-closed-ea-fc-league',
        description: 'Closed round-robin seed tournament for status and date filters.',
        format: 'round_robin',
        status: 'registration_closed',
        capacity: 8,
        publishedAt: new Date(now.getTime() - 10 * day),
        registrationOpenAt: new Date(now.getTime() - 9 * day),
        registrationCloseAt: new Date(now.getTime() - day),
        startsAt: new Date(now.getTime() + 2 * day),
      },
      {
        key: 'full-dota',
        gameKey: 'dota-2',
        title: 'Phase 1 Dev Full Capacity Dota 2 Cup',
        slug: 'phase1-dev-full-capacity-dota-2-cup',
        description: 'Full-capacity registration-open seed tournament.',
        format: 'manual',
        status: 'registration_open',
        capacity: 2,
        publishedAt: new Date(now.getTime() - 3 * day),
        registrationOpenAt: new Date(now.getTime() - 2 * day),
        registrationCloseAt: new Date(now.getTime() + 3 * day),
        startsAt: new Date(now.getTime() + 5 * day),
      },
      {
        key: 'cancelled-cs2',
        gameKey: 'counter-strike-2',
        title: 'Phase 1 Dev Cancelled CS2 Invitational',
        slug: 'phase1-dev-cancelled-cs2-invitational',
        description: 'Cancelled seed tournament for lifecycle and notification checks.',
        format: 'single_elimination',
        status: 'cancelled',
        capacity: 8,
        publishedAt: new Date(now.getTime() - 6 * day),
        cancelledAt: new Date(now.getTime() - day),
        startsAt: new Date(now.getTime() + 4 * day),
      },
      {
        key: 'completed-valorant',
        gameKey: 'valorant',
        title: 'Phase 1 Dev Completed Valorant Finals',
        slug: 'phase1-dev-completed-valorant-finals',
        description: 'Completed tournament with registrations and match results.',
        format: 'single_elimination',
        status: 'completed',
        capacity: 4,
        publishedAt: new Date(now.getTime() - 20 * day),
        registrationOpenAt: new Date(now.getTime() - 19 * day),
        registrationCloseAt: new Date(now.getTime() - 12 * day),
        startsAt: new Date(now.getTime() - 7 * day),
        endsAt: new Date(now.getTime() - 2 * day),
      },
    ] as const;

    for (const tournament of tournamentSeed) {
      const game = gamesByKey.get(tournament.gameKey);
      if (!game) {
        skipped.push(`missing-game:${tournament.gameKey}`);
        continue;
      }

      const existing = await this.collection('tournaments').findOne({ slugNormalized: tournament.slug });
      this.assertDocumentCanBeSeedUpdated(existing, 'tournament', tournament.slug);
      const publishedAt = 'publishedAt' in tournament ? tournament.publishedAt : undefined;
      const cancelledAt = 'cancelledAt' in tournament ? tournament.cancelledAt : undefined;
      const registrationOpenAt =
        'registrationOpenAt' in tournament ? tournament.registrationOpenAt : undefined;
      const registrationCloseAt =
        'registrationCloseAt' in tournament ? tournament.registrationCloseAt : undefined;
      const endsAt = 'endsAt' in tournament ? tournament.endsAt : undefined;

      const result = await this.upsertSeedDocument(this.collection('tournaments'), { slugNormalized: tournament.slug }, {
        title: tournament.title,
        slug: tournament.slug,
        slugNormalized: tournament.slug,
        description: tournament.description,
        gameId: String(game._id),
        format: tournament.format,
        status: tournament.status,
        participantType: 'individual',
        capacity: tournament.capacity,
        rules: 'Local/test seed tournament rules. No prizes or production operations.',
        ...(publishedAt ? { publishedAt } : {}),
        ...(cancelledAt ? { cancelledAt } : {}),
        ...(registrationOpenAt ? { registrationOpenAt } : {}),
        ...(registrationCloseAt ? { registrationCloseAt } : {}),
        ...(tournament.startsAt ? { startsAt: tournament.startsAt } : {}),
        ...(endsAt ? { endsAt } : {}),
      }, now);

      if (result.created) created += 1;
      if (result.updated) updated += 1;
      documentsByKey.set(tournament.key, result.document as SeedDocument);
    }

    return { created, updated, documentsByKey };
  }

  private async seedRegistrations(
    now: Date,
    usersByKey: ReadonlyMap<string, SeedDocument>,
    tournamentsByKey: ReadonlyMap<string, SeedDocument>,
    skipped: string[],
  ): Promise<SeedBatchResult> {
    const documentsByKey = new Map<string, SeedDocument>();
    let created = 0;
    let updated = 0;
    const day = 24 * 60 * 60 * 1000;

    const registrationSeed = [
      { key: 'open-p1-submitted', tournamentKey: 'open-valorant', userKey: 'player1', status: 'submitted', seed: 1 },
      { key: 'open-p2-approved', tournamentKey: 'open-valorant', userKey: 'player2', status: 'approved', seed: 2 },
      { key: 'open-p3-rejected', tournamentKey: 'open-valorant', userKey: 'player3', status: 'rejected', rejectedReason: 'Local seed rejection case.' },
      { key: 'closed-p1-approved', tournamentKey: 'closed-eafc', userKey: 'player1', status: 'approved', seed: 1 },
      { key: 'closed-p2-approved', tournamentKey: 'closed-eafc', userKey: 'player2', status: 'approved', seed: 2 },
      { key: 'closed-p3-withdrawn', tournamentKey: 'closed-eafc', userKey: 'player3', status: 'withdrawn' },
      { key: 'full-p1-approved', tournamentKey: 'full-dota', userKey: 'player1', status: 'approved', seed: 1 },
      { key: 'full-p2-approved', tournamentKey: 'full-dota', userKey: 'player2', status: 'approved', seed: 2 },
      { key: 'cancelled-p1-cancelled', tournamentKey: 'cancelled-cs2', userKey: 'player1', status: 'cancelled' },
      { key: 'completed-p1-approved', tournamentKey: 'completed-valorant', userKey: 'player1', status: 'approved', seed: 1 },
      { key: 'completed-p2-approved', tournamentKey: 'completed-valorant', userKey: 'player2', status: 'approved', seed: 2 },
      { key: 'completed-p3-approved', tournamentKey: 'completed-valorant', userKey: 'player3', status: 'approved', seed: 3 },
      { key: 'completed-p4-approved', tournamentKey: 'completed-valorant', userKey: 'player4', status: 'approved', seed: 4 },
    ] as const;

    for (const registration of registrationSeed) {
      const tournament = tournamentsByKey.get(registration.tournamentKey);
      const user = usersByKey.get(registration.userKey);
      if (!tournament || !user) {
        skipped.push(`missing-registration-ref:${registration.key}`);
        continue;
      }

      const statusDate = new Date(now.getTime() - day);
      const registrationSeedNumber = 'seed' in registration ? registration.seed : undefined;
      const rejectedReason =
        'rejectedReason' in registration ? registration.rejectedReason : undefined;
      const result = await this.upsertSeedDocument(this.collection('tournament_registrations'), {
        tournamentId: tournament._id,
        userId: String(user._id),
      }, {
        tournamentId: tournament._id,
        userId: String(user._id),
        type: 'individual',
        status: registration.status,
        submittedAt: new Date(now.getTime() - 2 * day),
        participantDisplayName: this.seedDisplayName(registration.userKey),
        ...(registrationSeedNumber !== undefined ? { seed: registrationSeedNumber } : {}),
        ...(registration.status === 'approved' ? { approvedAt: statusDate } : {}),
        ...(registration.status === 'rejected' ? { rejectedAt: statusDate, rejectedReason } : {}),
        ...(registration.status === 'withdrawn' ? { withdrawnAt: statusDate } : {}),
        ...(registration.status === 'cancelled' ? { cancelledAt: statusDate } : {}),
      }, now);

      if (result.created) created += 1;
      if (result.updated) updated += 1;
      documentsByKey.set(registration.key, result.document as SeedDocument);
    }

    return { created, updated, documentsByKey };
  }

  private async seedMatches(
    now: Date,
    tournamentsByKey: ReadonlyMap<string, SeedDocument>,
    registrationsByKey: ReadonlyMap<string, SeedDocument>,
    skipped: string[],
  ): Promise<SeedBatchResult> {
    const documentsByKey = new Map<string, SeedDocument>();
    let created = 0;
    let updated = 0;
    const day = 24 * 60 * 60 * 1000;

    const matchSeed = [
      {
        key: 'open-valorant-r1m1',
        tournamentKey: 'open-valorant',
        round: 1,
        matchNumber: 1,
        status: 'scheduled',
        p1: 'open-p1-submitted',
        p2: 'open-p2-approved',
        scheduledAt: new Date(now.getTime() + 9 * day),
      },
      {
        key: 'completed-r1m1',
        tournamentKey: 'completed-valorant',
        round: 1,
        matchNumber: 1,
        status: 'completed',
        p1: 'completed-p1-approved',
        p2: 'completed-p4-approved',
        winner: 'completed-p1-approved',
        participant1Score: 13,
        participant2Score: 8,
        scheduledAt: new Date(now.getTime() - 6 * day),
      },
      {
        key: 'completed-r1m2',
        tournamentKey: 'completed-valorant',
        round: 1,
        matchNumber: 2,
        status: 'completed',
        p1: 'completed-p2-approved',
        p2: 'completed-p3-approved',
        winner: 'completed-p2-approved',
        participant1Score: 13,
        participant2Score: 11,
        scheduledAt: new Date(now.getTime() - 6 * day),
      },
      {
        key: 'completed-final',
        tournamentKey: 'completed-valorant',
        round: 2,
        matchNumber: 1,
        status: 'completed',
        p1: 'completed-p1-approved',
        p2: 'completed-p2-approved',
        winner: 'completed-p1-approved',
        participant1Score: 13,
        participant2Score: 9,
        scheduledAt: new Date(now.getTime() - 5 * day),
      },
    ] as const;

    for (const match of matchSeed) {
      const tournament = tournamentsByKey.get(match.tournamentKey);
      const p1 = registrationsByKey.get(match.p1);
      const p2 = registrationsByKey.get(match.p2);
      if (!tournament || !p1 || !p2) {
        skipped.push(`missing-match-ref:${match.key}`);
        continue;
      }

      const winnerKey = 'winner' in match ? match.winner : undefined;
      const winner = winnerKey ? registrationsByKey.get(winnerKey) : undefined;
      const completedAt = match.status === 'completed' ? new Date(now.getTime() - 4 * day) : undefined;
      const participant1Score =
        'participant1Score' in match ? match.participant1Score : undefined;
      const participant2Score =
        'participant2Score' in match ? match.participant2Score : undefined;
      const result = await this.upsertSeedDocument(this.collection('tournament_matches'), {
        tournamentId: tournament._id,
        round: match.round,
        matchNumber: match.matchNumber,
      }, {
        tournamentId: tournament._id,
        round: match.round,
        matchNumber: match.matchNumber,
        status: match.status,
        participant1Id: p1._id,
        participant2Id: p2._id,
        scheduledAt: match.scheduledAt,
        generatedAt: now,
        ...(winner ? { winnerId: winner._id } : {}),
        ...(completedAt ? { completedAt, resultRecordedAt: completedAt } : {}),
        ...(participant1Score !== undefined ? { participant1Score } : {}),
        ...(participant2Score !== undefined ? { participant2Score } : {}),
      }, now);

      if (result.created) created += 1;
      if (result.updated) updated += 1;
      documentsByKey.set(match.key, result.document as SeedDocument);
    }

    return { created, updated, documentsByKey };
  }

  private async seedNotificationLogs(
    now: Date,
    usersByKey: ReadonlyMap<string, SeedDocument>,
    skipped: string[],
  ): Promise<SeedBatchResult> {
    const documentsByKey = new Map<string, SeedDocument>();
    let created = 0;
    let updated = 0;

    const notifications = [
      { key: 'registration-submitted', userKey: 'player1', purpose: 'registration.submitted', status: 'sent' },
      { key: 'registration-approved', userKey: 'player2', purpose: 'registration.approved', status: 'sent' },
      { key: 'registration-rejected', userKey: 'player3', purpose: 'registration.rejected', status: 'sent' },
      { key: 'tournament-cancelled', userKey: 'player1', purpose: 'tournament.cancelled', status: 'sent' },
    ] as const;

    for (const notification of notifications) {
      const user = usersByKey.get(notification.userKey);
      if (!user) {
        skipped.push(`missing-notification-user:${notification.userKey}`);
        continue;
      }

      const result = await this.upsertSeedDocument(this.collection('notification_logs'), {
        providerMessageId: `${PHASE1_DEV_SEED_BATCH}:${notification.key}`,
      }, {
        channel: 'sms',
        provider: 'local-dev-seed',
        recipientMasked: '+1********' + String(user.phoneNormalized).slice(-4),
        recipientHash: `local-dev-seed:${notification.userKey}`,
        purpose: notification.purpose,
        status: notification.status,
        providerMessageId: `${PHASE1_DEV_SEED_BATCH}:${notification.key}`,
      }, now);

      if (result.created) created += 1;
      if (result.updated) updated += 1;
      documentsByKey.set(notification.key, result.document as SeedDocument);
    }

    return { created, updated, documentsByKey };
  }

  private async loadRoleIdsByKey(): Promise<Map<string, Types.ObjectId>> {
    const roleDocs = await this.collection('roles')
      .find({ key: { $in: PHASE1_DEV_SEED_ACCOUNTS.map((account) => account.roleKey) } })
      .toArray();

    const map = new Map<string, Types.ObjectId>();
    for (const role of roleDocs) {
      if (typeof role.key === 'string') {
        map.set(role.key, role._id as Types.ObjectId);
      }
    }
    return map;
  }

  private async upsertSeedDocument(
    collection: MongoCollection,
    filter: MongoFilter,
    fields: Record<string, unknown>,
    now: Date,
  ): Promise<UpsertResult> {
    const sanitizedFields = stripUndefined(fields);
    const result = await collection.updateOne(
      filter,
      {
        $setOnInsert: {
          createdAt: now,
        },
        $set: {
          ...sanitizedFields,
          seedSource: PHASE1_DEV_SEED_SOURCE,
          seedBatch: PHASE1_DEV_SEED_BATCH,
          updatedAt: now,
        },
      },
      { upsert: true },
    );

    const document = await collection.findOne(filter);
    if (!document) {
      throw new Error(`Seed upsert failed for collection ${collection.collectionName}.`);
    }

    return {
      document: document as MongoDocument,
      created: Boolean(result.upsertedId),
      updated: !result.upsertedId && (result.modifiedCount ?? 0) > 0,
    };
  }

  private collection(name: string): MongoCollection {
    if (!this.connection.db) {
      throw new Error('Database connection is not initialized.');
    }

    return this.connection.db.collection(name);
  }

  private assertDocumentCanBeSeedUpdated(document: Record<string, unknown> | null, type: string, key: string): void {
    if (!document) return;

    const seedSource = readNestedString(document, ['metadata', 'registrationSource']) ?? readString(document, 'seedSource');
    if (seedSource !== PHASE1_DEV_SEED_SOURCE) {
      throw new Error(`Refusing to overwrite non-seed ${type}: ${key}.`);
    }
  }

  private seedDisplayName(userKey: string): string {
    const account = PHASE1_DEV_SEED_ACCOUNTS.find((item) => item.key === userKey);
    return account?.displayName ?? 'Seed Participant';
  }
}

interface SeedBatchResult {
  readonly created: number;
  readonly updated: number;
  readonly documentsByKey: ReadonlyMap<string, SeedDocument>;
}

function seedFilter(): MongoFilter {
  return {
    seedSource: PHASE1_DEV_SEED_SOURCE,
    seedBatch: PHASE1_DEV_SEED_BATCH,
  };
}

function stripUndefined(fields: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function readString(document: Record<string, unknown>, key: string): string | undefined {
  const value = document[key];
  return typeof value === 'string' ? value : undefined;
}

function readNestedString(document: Record<string, unknown>, path: readonly string[]): string | undefined {
  let value: unknown = document;
  for (const key of path) {
    if (typeof value !== 'object' || value === null || !(key in value)) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[key];
  }
  return typeof value === 'string' ? value : undefined;
}
