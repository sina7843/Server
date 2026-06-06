import { readFileSync } from 'fs';
import { join } from 'path';
import { AuditAction, AUDIT_RESOURCE_TYPES } from '@dragon/types';

// ─── Phase 1 / Slice 11 — Audit and Operational Hardening Guardrails ─────────
//
// PERMANENT guardrails verifying:
//   1. AuditAction constant coverage for all Phase 1 tournament domain events
//   2. Backend service audit hook alignment (source analysis)
//   3. Known limitations are documented, not fake-covered
//   4. Audit redactor redacts required sensitive keys
//   5. Audit payloads exclude phone/email/team-member contact data
//   6. No new audit product routes/dashboard/export/search (Phase 0 AuditController is pre-existing)
//   7. Backend runtime files exclude hardcoded credentials and provider secrets
//   8. Backend service files exclude fake runtime data
//   9. Route guardrails: no forbidden backend routes (Phase 0 infrastructure is allowlisted)
//  10. Future-scope: no live scoring, WebSocket scoreboard, or bracket editor
//
// Phase 0 pre-existing infrastructure (NOT introduced by Slice 11 — do not block):
//   - AdminAnalyticsController at admin/v1/analytics (auth/OTP/content/media analytics)
//   - AdminAuditController at admin/v1/audit-logs (read-only audit log viewer)
//   - AdminNotificationsController at admin/v1/system/notifications (notification log viewer)

const API_SRC = join(__dirname, '..');

// ─── Service source paths ─────────────────────────────────────────────────────

const ADMIN_TOURNAMENTS_CTRL = join(API_SRC, 'admin/tournaments/admin-tournaments.controller.ts');
const REGISTRATION_SERVICE = join(
  API_SRC,
  'tournament-registrations/tournament-registration.service.ts',
);
const PARTICIPANT_SERVICE = join(
  API_SRC,
  'tournament-participants/tournament-participant.service.ts',
);
const MATCH_SERVICE = join(API_SRC, 'tournament-matches/tournament-match.service.ts');
const RESULT_SERVICE = join(API_SRC, 'tournament-matches/tournament-result.service.ts');
const STANDINGS_SERVICE = join(API_SRC, 'tournament-standings/tournament-standings.service.ts');
const AUDIT_REDACTOR = join(API_SRC, 'audit/audit-redactor.ts');
const NOTIFICATION_SERVICE_SRC = join(API_SRC, 'notifications/tournament-notification.service.ts');
const SMS_CONFIG = join(API_SRC, 'auth/sms/sms.service.ts');

// ─── Phase 0 pre-existing infrastructure paths ────────────────────────────────
// These controllers exist from Phase 0 and must NOT be targeted by "does not exist" checks.

const PHASE0_ANALYTICS_CTRL = join(API_SRC, 'analytics/admin/admin-analytics.controller.ts');
const PHASE0_AUDIT_CTRL = join(API_SRC, 'admin/audit/admin-audit.controller.ts');
const PHASE0_NOTIFICATIONS_CTRL = join(
  API_SRC,
  'admin/notifications/admin-notifications.controller.ts',
);

// ─── 1. AuditAction constant coverage ────────────────────────────────────────

describe('AuditAction constant coverage — Phase 1 tournament domain (PERMANENT)', () => {
  describe('tournament lifecycle events', () => {
    it.each([
      'TOURNAMENT_CREATED',
      'TOURNAMENT_UPDATED',
      'TOURNAMENT_PUBLISHED',
      'TOURNAMENT_REGISTRATION_OPENED',
      'TOURNAMENT_REGISTRATION_CLOSED',
      'TOURNAMENT_STARTED',
      'TOURNAMENT_COMPLETED',
      'TOURNAMENT_CANCELLED',
      'TOURNAMENT_ARCHIVED',
      'TOURNAMENT_DELETED',
    ] as const)('AuditAction.%s exists and has a value', (key) => {
      expect(AuditAction[key]).toBeDefined();
      expect(typeof AuditAction[key]).toBe('string');
      expect(AuditAction[key].length).toBeGreaterThan(0);
    });
  });

  describe('registration events', () => {
    it.each([
      'REGISTRATION_SUBMITTED',
      'REGISTRATION_UPDATED',
      'REGISTRATION_WITHDRAWN',
      'REGISTRATION_APPROVED',
      'REGISTRATION_REJECTED',
      'REGISTRATION_CANCELLED',
    ] as const)('AuditAction.%s exists and has a value', (key) => {
      expect(AuditAction[key]).toBeDefined();
    });
  });

  describe('participant events', () => {
    it.each(['PARTICIPANT_REMOVED', 'PARTICIPANT_DISQUALIFIED'] as const)(
      'AuditAction.%s exists and has a value',
      (key) => {
        expect(AuditAction[key]).toBeDefined();
      },
    );
  });

  describe('match events', () => {
    it.each(['MATCH_CREATED', 'MATCH_UPDATED', 'MATCH_CANCELLED', 'MATCH_GENERATED'] as const)(
      'AuditAction.%s exists and has a value',
      (key) => {
        expect(AuditAction[key]).toBeDefined();
      },
    );
  });

  describe('result events', () => {
    it.each(['RESULT_RECORDED', 'RESULT_UPDATED', 'RESULT_VOIDED'] as const)(
      'AuditAction.%s exists and has a value',
      (key) => {
        expect(AuditAction[key]).toBeDefined();
      },
    );
  });

  describe('standings event', () => {
    it('AuditAction.STANDINGS_RECALCULATED exists and has a value', () => {
      expect(AuditAction.STANDINGS_RECALCULATED).toBeDefined();
      expect(typeof AuditAction.STANDINGS_RECALCULATED).toBe('string');
    });
  });

  describe('audit resource types', () => {
    it('TOURNAMENT resource type is defined', () => {
      expect(AUDIT_RESOURCE_TYPES.TOURNAMENT).toBe('tournament');
    });

    it('TOURNAMENT_REGISTRATION resource type is defined', () => {
      expect(AUDIT_RESOURCE_TYPES.TOURNAMENT_REGISTRATION).toBe('tournament_registration');
    });

    it('TOURNAMENT_PARTICIPANT resource type is defined', () => {
      expect(AUDIT_RESOURCE_TYPES.TOURNAMENT_PARTICIPANT).toBe('tournament_participant');
    });

    it('TOURNAMENT_MATCH resource type is defined', () => {
      expect(AUDIT_RESOURCE_TYPES.TOURNAMENT_MATCH).toBe('tournament_match');
    });

    it('TOURNAMENT_RESULT resource type is defined', () => {
      expect(AUDIT_RESOURCE_TYPES.TOURNAMENT_RESULT).toBe('tournament_result');
    });
  });
});

// ─── 2. Backend service audit hook alignment (source analysis) ────────────────

describe('backend service audit hook alignment (PERMANENT)', () => {
  describe('AdminTournamentsController — tournament lifecycle', () => {
    const src = readFileSync(ADMIN_TOURNAMENTS_CTRL, 'utf8');

    it.each([
      'TOURNAMENT_CREATED',
      'TOURNAMENT_UPDATED',
      'TOURNAMENT_PUBLISHED',
      'TOURNAMENT_REGISTRATION_OPENED',
      'TOURNAMENT_REGISTRATION_CLOSED',
      'TOURNAMENT_STARTED',
      'TOURNAMENT_COMPLETED',
      'TOURNAMENT_CANCELLED',
      'TOURNAMENT_ARCHIVED',
      'TOURNAMENT_DELETED',
    ])('fires AuditAction.%s', (key) => {
      expect(src).toContain(`AuditAction.${key}`);
    });
  });

  describe('TournamentRegistrationService — registration lifecycle', () => {
    const src = readFileSync(REGISTRATION_SERVICE, 'utf8');

    it.each([
      'REGISTRATION_SUBMITTED',
      'REGISTRATION_UPDATED',
      'REGISTRATION_WITHDRAWN',
      'REGISTRATION_APPROVED',
      'REGISTRATION_REJECTED',
      'REGISTRATION_CANCELLED',
    ])('fires AuditAction.%s', (key) => {
      expect(src).toContain(`AuditAction.${key}`);
    });

    it('uses auditService?.log (fire-and-forget pattern)', () => {
      expect(src).toMatch(/void this\.auditService\?\.log\(/);
    });
  });

  describe('TournamentParticipantService — participant actions', () => {
    const src = readFileSync(PARTICIPANT_SERVICE, 'utf8');

    it('fires AuditAction.PARTICIPANT_REMOVED', () => {
      expect(src).toContain('AuditAction.PARTICIPANT_REMOVED');
    });

    it('fires AuditAction.PARTICIPANT_DISQUALIFIED', () => {
      expect(src).toContain('AuditAction.PARTICIPANT_DISQUALIFIED');
    });
  });

  describe('TournamentMatchService — match actions', () => {
    const src = readFileSync(MATCH_SERVICE, 'utf8');

    it.each(['MATCH_CREATED', 'MATCH_UPDATED', 'MATCH_CANCELLED', 'MATCH_GENERATED'])(
      'fires AuditAction.%s',
      (key) => {
        expect(src).toContain(`AuditAction.${key}`);
      },
    );
  });

  describe('TournamentResultService — result actions', () => {
    const src = readFileSync(RESULT_SERVICE, 'utf8');

    it.each(['RESULT_RECORDED', 'RESULT_UPDATED', 'RESULT_VOIDED'])(
      'fires AuditAction.%s',
      (key) => {
        expect(src).toContain(`AuditAction.${key}`);
      },
    );
  });

  describe('TournamentStandingsService — standings', () => {
    const src = readFileSync(STANDINGS_SERVICE, 'utf8');

    it('fires AuditAction.STANDINGS_RECALCULATED', () => {
      expect(src).toContain('AuditAction.STANDINGS_RECALCULATED');
    });
  });
});

// ─── 3. Known limitations — not fake-covered ─────────────────────────────────
//
// PARTICIPANT_UPDATED: updateParticipant() (seed/displayName) has no audit hook.
// No PARTICIPANT_UPDATED constant exists in AuditAction (intentional Phase 1 gap).
// Documented as a known limitation. Do not fake-cover with a placeholder log call.

describe('known audit coverage limitations (PERMANENT — do not fake-cover)', () => {
  it('PARTICIPANT_UPDATED is not defined in AuditAction (Phase 1 documented gap)', () => {
    expect('PARTICIPANT_UPDATED' in AuditAction).toBe(false);
  });

  it('updateParticipant() in participant service does not fake-log a non-existent action', () => {
    const src = readFileSync(PARTICIPANT_SERVICE, 'utf8');
    // The updateParticipant method exists
    expect(src).toContain('updateParticipant');
    // But must NOT contain a fake/invented audit action string for this operation
    expect(src).not.toContain('PARTICIPANT_UPDATED');
    expect(src).not.toContain("'participant.updated'");
  });
});

// ─── 4. Audit redactor sensitive key coverage ─────────────────────────────────

describe('audit redactor sensitive key coverage (PERMANENT)', () => {
  const src = readFileSync(AUDIT_REDACTOR, 'utf8');

  it.each([
    'password',
    'refreshtoken',
    'accesstoken',
    'secret',
    'authorization',
    'cookie',
    'providercredentials',
    'providersecret',
    'resettoken',
    'otp',
  ])('redactor list includes %s key', (key) => {
    expect(src.toLowerCase()).toContain(key);
  });

  it('redactor covers header authorization field', () => {
    expect(src).toContain('authorization');
  });

  it('redactor is applied to before, after, and metadata fields (via audit.service.ts)', () => {
    const auditServiceSrc = readFileSync(join(__dirname, 'audit.service.ts'), 'utf8');
    expect(auditServiceSrc).toContain('input.before');
    expect(auditServiceSrc).toContain('input.after');
    expect(auditServiceSrc).toContain('input.metadata');
    expect(auditServiceSrc).toContain('this.redactor.redact');
  });
});

// ─── 5. Audit payload safety — no PII ────────────────────────────────────────
//
// Audit payloads in registration service must not include:
//   - phone, phoneNormalized, email (recipient contact)
//   - members[] raw data (team contact)
//   - admin notes in `after` objects

describe('audit payload safety — no PII in backend service audit calls (PERMANENT)', () => {
  const registrationSrc = readFileSync(REGISTRATION_SERVICE, 'utf8');
  const participantSrc = readFileSync(PARTICIPANT_SERVICE, 'utf8');

  it('registration service audit after-objects do not include phone or email fields', () => {
    // Extract audit log blocks and verify they don't pass phone/email
    expect(registrationSrc).not.toMatch(/auditService.*phone|phone.*auditService/s);
    expect(registrationSrc).not.toMatch(/after:\s*\{[^}]*phone/);
    expect(registrationSrc).not.toMatch(/after:\s*\{[^}]*email/);
  });

  it('registration service audit after-objects do not include phoneNormalized', () => {
    expect(registrationSrc).not.toMatch(/after:\s*\{[^}]*phoneNormalized/);
  });

  it('registration service audit payloads do not include raw members contact data', () => {
    // The members field may appear in context of team registration business logic,
    // but it must not be spread into audit after/before/metadata objects
    expect(registrationSrc).not.toMatch(/after:\s*\{[^}]*members:/);
    expect(registrationSrc).not.toMatch(/before:\s*\{[^}]*members:/);
  });

  it('participant service audit payloads do not include phone or email', () => {
    expect(participantSrc).not.toMatch(/after:\s*\{[^}]*phone/);
    expect(participantSrc).not.toMatch(/after:\s*\{[^}]*email/);
  });

  it('notification service does not pass recipient contact to audit layer', () => {
    const notifSrc = readFileSync(NOTIFICATION_SERVICE_SRC, 'utf8');
    // Notification service uses SmsService (which handles its own logging/masking)
    // It must not call auditService directly with recipient contact
    expect(notifSrc).not.toContain('auditService');
  });
});

// ─── 6. No new audit product routes ──────────────────────────────────────────

describe('no new audit product introduced (PERMANENT)', () => {
  it('AuditAction constant object has no method-shaped values (it is a value map, not a class)', () => {
    for (const val of Object.values(AuditAction)) {
      expect(typeof val).toBe('string');
    }
  });

  it('audit service source does not expose a public HTTP endpoint', () => {
    const auditServiceSrc = readFileSync(join(__dirname, 'audit.service.ts'), 'utf8');
    expect(auditServiceSrc).not.toContain('@Controller');
    expect(auditServiceSrc).not.toContain('@Get(');
    expect(auditServiceSrc).not.toContain('@Post(');
  });

  it('AuditService does not expose HTTP endpoints (AdminAuditController at admin/v1/audit-logs is Phase 0 pre-existing and separate)', () => {
    // AuditService is a provider only — no controller annotations.
    // AdminAuditController (admin/v1/audit-logs) is Phase 0 pre-existing read-only infrastructure.
    // Slice 11 must not add audit dashboard, search, or export endpoints.
    const auditServiceSrc = readFileSync(join(__dirname, 'audit.service.ts'), 'utf8');
    expect(auditServiceSrc).not.toContain('/audit/logs');
    expect(auditServiceSrc).not.toContain('/admin/audit');
  });

  it('Phase 0 AdminAuditController route is admin/v1/audit-logs (read-only) — no expansion in Slice 11', () => {
    // Verify Phase 0 audit infrastructure: read-only log access at admin/v1/audit-logs.
    const auditCtrlSrc = readFileSync(PHASE0_AUDIT_CTRL, 'utf8');
    expect(auditCtrlSrc).toContain("@Controller('admin/v1/audit-logs')");
    // Slice 11 new services must not add audit dashboard or export routes.
    const notifSrc = readFileSync(NOTIFICATION_SERVICE_SRC, 'utf8');
    expect(notifSrc).not.toContain('@Controller');
    expect(notifSrc).not.toContain('/admin/v1/audit');
  });
});

// ─── 7. Backend runtime files — no hardcoded credentials / provider secrets ───

describe('backend runtime hardening — no hardcoded credentials (PERMANENT)', () => {
  const filesToCheck = [
    { label: 'tournament-notification.service.ts', path: NOTIFICATION_SERVICE_SRC },
    { label: 'audit.service.ts', path: join(__dirname, 'audit.service.ts') },
  ];

  for (const { label, path } of filesToCheck) {
    describe(`${label}`, () => {
      const src = readFileSync(path, 'utf8');

      it('does not hardcode localhost as an API origin', () => {
        expect(src).not.toMatch(/localhost:\d+/);
      });

      it('does not hardcode qesb.ir production domain', () => {
        expect(src).not.toMatch(/https?:\/\/qesb\.ir/);
      });

      it('does not hardcode provider API keys or secrets', () => {
        expect(src).not.toMatch(/api[_-]?key\s*[:=]\s*['"`][^'"`]{4,}/i);
        expect(src).not.toMatch(/secret\s*[:=]\s*['"`][^'"`]{8,}/i);
      });

      it('does not hardcode SMS sender IDs or phone numbers', () => {
        expect(src).not.toMatch(/sender[_-]?id\s*[:=]\s*['"`]/i);
        expect(src).not.toMatch(/\+98\d{10}/);
      });
    });
  }

  it('sms service does not hardcode provider credentials or phone numbers', () => {
    const src = readFileSync(SMS_CONFIG, 'utf8');
    expect(src).not.toMatch(/\+98\d{10}/);
    expect(src).not.toMatch(/api[_-]?key\s*[:=]\s*['"`][^'"`]{4,}/i);
    expect(src).not.toMatch(/secret\s*[:=]\s*['"`][^'"`]{8,}/i);
  });

  it('notification service does not hardcode analytics secrets', () => {
    const src = readFileSync(NOTIFICATION_SERVICE_SRC, 'utf8');
    expect(src).not.toMatch(/analytics[_-]?key\s*[:=]\s*['"`]/i);
  });
});

// ─── 8. Backend — no fake runtime data in services ───────────────────────────

describe('no fake runtime data in backend Phase 1 services (PERMANENT)', () => {
  const serviceFiles = [
    { label: 'tournament-registration.service.ts', path: REGISTRATION_SERVICE },
    { label: 'tournament-participant.service.ts', path: PARTICIPANT_SERVICE },
    { label: 'tournament-match.service.ts', path: MATCH_SERVICE },
    { label: 'tournament-result.service.ts', path: RESULT_SERVICE },
    { label: 'tournament-standings.service.ts', path: STANDINGS_SERVICE },
    { label: 'tournament-notification.service.ts', path: NOTIFICATION_SERVICE_SRC },
  ];

  for (const { label, path } of serviceFiles) {
    it(`${label} does not contain hardcoded fake MongoDB IDs in runtime code`, () => {
      const src = readFileSync(path, 'utf8');
      // Hardcoded ObjectIds are only allowed in test fixtures, not runtime service code
      expect(src).not.toMatch(/507f1f77bcf86cd799439/);
    });

    it(`${label} does not contain fake placeholder notifications or fake send claims`, () => {
      const src = readFileSync(path, 'utf8');
      expect(src).not.toMatch(/fakeSend|fakeDeliver|mockDeliver.*production/i);
    });
  }
});

// ─── 9. Route guardrails — no forbidden backend routes ───────────────────────

describe('forbidden backend route guardrails (PERMANENT)', () => {
  const adminControllersDir = join(API_SRC, 'admin');

  it('no backend controller exposes /api/v1/notifications public product route (admin/v1/system/notifications is Phase 0 pre-existing)', () => {
    // AdminNotificationsController at admin/v1/system/notifications is Phase 0 pre-existing infrastructure.
    // Forbidden: a public /api/v1/notifications product route — must not exist in Slice 11.
    const notifSrc = readFileSync(NOTIFICATION_SERVICE_SRC, 'utf8');
    expect(notifSrc).not.toContain("@Controller('api/v1/notifications')");
    expect(notifSrc).not.toContain("@Controller('notifications')");
    // Phase 0 admin notifications controller uses the system-scoped path, not a public path
    const adminNotifSrc = readFileSync(PHASE0_NOTIFICATIONS_CTRL, 'utf8');
    expect(adminNotifSrc).toContain("@Controller('admin/v1/system/notifications')");
    expect(adminNotifSrc).not.toContain("@Controller('api/v1/notifications')");
  });

  it('admin/v1/analytics is Phase 0 pre-existing (AdminAnalyticsController) — Slice 11 files do not add a second analytics controller', () => {
    // AdminAnalyticsController at admin/v1/analytics is Phase 0 pre-existing infrastructure
    // covering auth/OTP/content/media analytics. It is NOT introduced by Slice 11.
    // Slice 11 new files (notification service, admin tournaments controller) must not claim this route.
    const analyticsCtrlSrc = readFileSync(PHASE0_ANALYTICS_CTRL, 'utf8');
    expect(analyticsCtrlSrc).toContain("@Controller('admin/v1/analytics')");
    // Slice 11 files must not add a competing analytics controller
    expect(readFileSync(NOTIFICATION_SERVICE_SRC, 'utf8')).not.toContain(
      "@Controller('admin/v1/analytics')",
    );
    expect(readFileSync(ADMIN_TOURNAMENTS_CTRL, 'utf8')).not.toContain(
      "@Controller('admin/v1/analytics')",
    );
  });

  it('admin/v1/audit-logs is Phase 0 pre-existing (AdminAuditController) — no new /admin/v1/audit route in Slice 11 files', () => {
    // AdminAuditController at admin/v1/audit-logs is Phase 0 pre-existing read-only infrastructure.
    // The route /admin/v1/audit (without -logs suffix) must not be added by Slice 11.
    expect(readFileSync(NOTIFICATION_SERVICE_SRC, 'utf8')).not.toContain(
      "@Controller('admin/v1/audit')",
    );
    expect(readFileSync(ADMIN_TOURNAMENTS_CTRL, 'utf8')).not.toContain(
      "@Controller('admin/v1/audit')",
    );
  });

  it('no backend controller exposes /api/v1/notification-preferences route', () => {
    const notifSrc = readFileSync(NOTIFICATION_SERVICE_SRC, 'utf8');
    expect(notifSrc).not.toContain('notification-preferences');
  });

  it('no backend controller exposes /admin/v1/campaigns route', () => {
    const adminTournamentsSrc = readFileSync(ADMIN_TOURNAMENTS_CTRL, 'utf8');
    expect(adminTournamentsSrc).not.toContain('campaigns');
  });

  it('tournament registration service does not expose /tournaments/:slug/matches/:matchId endpoint', () => {
    const regSrc = readFileSync(REGISTRATION_SERVICE, 'utf8');
    expect(regSrc).not.toMatch(/matches\/:matchId|matches\/\[matchId\]/);
  });

  it('no tournament service exposes /tournaments/:id/operations route', () => {
    const adminSrc = readFileSync(ADMIN_TOURNAMENTS_CTRL, 'utf8');
    expect(adminSrc).not.toContain("':id/operations'");
    expect(adminSrc).not.toContain("'/:id/operations'");
  });

  it('no tournament service exposes /tournaments/:id/preview route', () => {
    const adminSrc = readFileSync(ADMIN_TOURNAMENTS_CTRL, 'utf8');
    expect(adminSrc).not.toContain("':id/preview'");
    expect(adminSrc).not.toContain("'/:id/preview'");
  });

  it('admin controller does not reference /admin/v1/notifications product path', () => {
    const src = readFileSync(
      join(adminControllersDir, 'tournaments/admin-tournaments.controller.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/\/admin\/v1\/notifications/);
  });
});

// ─── 10. Future-scope guardrails ─────────────────────────────────────────────

describe('future-scope guardrails — no forbidden Phase 1 features (PERMANENT)', () => {
  const allServiceSrc = [
    REGISTRATION_SERVICE,
    PARTICIPANT_SERVICE,
    MATCH_SERVICE,
    RESULT_SERVICE,
    STANDINGS_SERVICE,
    NOTIFICATION_SERVICE_SRC,
    ADMIN_TOURNAMENTS_CTRL,
  ]
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');

  it('no live scoring endpoint or method in Phase 1 services', () => {
    expect(allServiceSrc).not.toMatch(/liveScore|live_score|updateLiveScore/i);
    expect(allServiceSrc).not.toMatch(/scoreUpdate|scoreboard.*live|live.*scoreboard/i);
  });

  it('no WebSocket gateway or scoreboard in Phase 1 services', () => {
    expect(allServiceSrc).not.toMatch(/@WebSocketGateway|@SubscribeMessage|socket\.io/i);
    expect(allServiceSrc).not.toMatch(/wsScoreboard|wsScore|realtimeScore/i);
  });

  it('no bracket editor or editable bracket in Phase 1 services', () => {
    expect(allServiceSrc).not.toMatch(/editBracket|overrideBracket|dragDrop|bracketEditor/i);
    expect(allServiceSrc).not.toMatch(/bracketNode.*update|advancedBracket/i);
  });

  it('no Swiss or Double Elimination format logic in Phase 1 services', () => {
    expect(allServiceSrc).not.toMatch(/['"`]swiss['"`]/i);
    expect(allServiceSrc).not.toMatch(/['"`]double_elimination['"`]/i);
    expect(allServiceSrc).not.toMatch(/swissRound|doubleElim/i);
  });

  it('no campaign or marketing notification system in Phase 1 services', () => {
    expect(allServiceSrc).not.toMatch(/sendMarketing|sendCampaign|sendNewsletter|sendBroadcast/i);
    expect(allServiceSrc).not.toMatch(/campaignId|marketingSegment/i);
  });

  it('no push notification system in Phase 1 services', () => {
    expect(allServiceSrc).not.toMatch(/sendPush|pushNotif|fcmToken|apnsToken/i);
  });

  it('no in-app notification center in Phase 1 services', () => {
    expect(allServiceSrc).not.toMatch(/createInAppNotification|inAppNotif|notifCenter/i);
  });

  it('no analytics dashboard or admin analytics product in Phase 1 services', () => {
    expect(allServiceSrc).not.toMatch(/analyticsReport|analyticsDashboard|adminAnalytics/i);
  });

  it('no audit dashboard or audit search/export product in Phase 1 services', () => {
    expect(allServiceSrc).not.toMatch(/auditDashboard|auditReport|auditExport|auditSearch/i);
  });
});
