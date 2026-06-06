import { readFileSync } from 'fs';
import { join } from 'path';
import { ANALYTICS_EVENT_TYPES } from '@dragon/types';

// ─── Exact event name guardrails ──────────────────────────────────────────────
//
// PERMANENT guardrails for Phase 1 tournament analytics events (Slice 11).
// These tests enforce:
//   1. Exact locked event names — no typos, no aliases
//   2. Single canonical owner per event — no duplicate fire points
//   3. Safe payloads — no PII, no tokens, no admin-only fields
//   4. No analytics dashboard/routes/settings introduced
//   5. No fake provider or hardcoded secrets

const LOCKED_TOURNAMENT_EVENTS = [
  'tournament.viewed',
  'tournament.registration_started',
  'tournament.registration_completed',
  'tournament.bracket_viewed',
  'tournament.match_viewed',
] as const;

// Source files for each event owner
const PUBLIC_TOURNAMENTS_CTRL = join(
  __dirname,
  '../public-tournaments/public-tournaments.controller.ts',
);
const PUBLIC_REGISTRATIONS_CTRL = join(
  __dirname,
  '../tournament-registrations/public-tournament-registrations.controller.ts',
);
const REGISTRATION_SERVICE = join(
  __dirname,
  '../tournament-registrations/tournament-registration.service.ts',
);
const PUBLIC_BRACKET_CTRL = join(
  __dirname,
  '../tournament-bracket/public-tournament-bracket.controller.ts',
);
const PUBLIC_MATCHES_CTRL = join(
  __dirname,
  '../tournament-matches/public-tournament-matches.controller.ts',
);

describe('Tournament analytics event guardrails (Slice 11 — PERMANENT)', () => {
  // ─── Exact event names in @dragon/types ──────────────────────────────────

  describe('locked event names exist in @dragon/types', () => {
    it.each(LOCKED_TOURNAMENT_EVENTS)('ANALYTICS_EVENT_TYPES includes %s', (event) => {
      expect(ANALYTICS_EVENT_TYPES).toContain(event);
    });
  });

  // ─── Forbidden event name aliases ─────────────────────────────────────────

  describe('forbidden event name aliases are not used in any owner file', () => {
    const allOwnerSrc = [
      PUBLIC_TOURNAMENTS_CTRL,
      PUBLIC_REGISTRATIONS_CTRL,
      REGISTRATION_SERVICE,
      PUBLIC_BRACKET_CTRL,
      PUBLIC_MATCHES_CTRL,
    ]
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');

    const FORBIDDEN_ALIASES = [
      'tournament_viewed',
      'tournament.detail_viewed',
      'tournament_view',
      'tournament.list_viewed',
      'tournament.form_submitted',
      'tournament.registration_submit',
      'tournament.register_completed',
      'tournament.bracket_loaded',
      'tournament.matchListViewed',
      'tournament.matches_viewed',
      'tournament_match_viewed',
      'tournament_bracket_viewed',
      'tournament.bracketViewed',
    ];

    it.each(FORBIDDEN_ALIASES)('alias %s is not used in any owner file', (alias) => {
      expect(allOwnerSrc).not.toContain(alias);
    });
  });

  // ─── Single canonical owner per event ────────────────────────────────────

  describe('each event fires from exactly one canonical owner', () => {
    it('tournament.viewed fires only from PublicTournamentsController', () => {
      const ownerSrc = readFileSync(PUBLIC_TOURNAMENTS_CTRL, 'utf8');
      expect(ownerSrc).toContain("type: 'tournament.viewed'");

      // Must not fire from any other owner
      const nonOwners = [
        PUBLIC_REGISTRATIONS_CTRL,
        REGISTRATION_SERVICE,
        PUBLIC_BRACKET_CTRL,
        PUBLIC_MATCHES_CTRL,
      ];
      for (const f of nonOwners) {
        expect(readFileSync(f, 'utf8')).not.toContain("'tournament.viewed'");
      }
    });

    it('tournament.registration_started fires only from PublicTournamentRegistrationsController', () => {
      const ownerSrc = readFileSync(PUBLIC_REGISTRATIONS_CTRL, 'utf8');
      expect(ownerSrc).toContain("type: 'tournament.registration_started'");

      const nonOwners = [
        PUBLIC_TOURNAMENTS_CTRL,
        REGISTRATION_SERVICE,
        PUBLIC_BRACKET_CTRL,
        PUBLIC_MATCHES_CTRL,
      ];
      for (const f of nonOwners) {
        expect(readFileSync(f, 'utf8')).not.toContain("'tournament.registration_started'");
      }
    });

    it('tournament.registration_completed fires only from TournamentRegistrationService', () => {
      const ownerSrc = readFileSync(REGISTRATION_SERVICE, 'utf8');
      expect(ownerSrc).toContain("type: 'tournament.registration_completed'");

      const nonOwners = [
        PUBLIC_TOURNAMENTS_CTRL,
        PUBLIC_REGISTRATIONS_CTRL,
        PUBLIC_BRACKET_CTRL,
        PUBLIC_MATCHES_CTRL,
      ];
      for (const f of nonOwners) {
        expect(readFileSync(f, 'utf8')).not.toContain("'tournament.registration_completed'");
      }
    });

    it('tournament.bracket_viewed fires only from PublicTournamentBracketController', () => {
      const ownerSrc = readFileSync(PUBLIC_BRACKET_CTRL, 'utf8');
      expect(ownerSrc).toContain("type: 'tournament.bracket_viewed'");

      const nonOwners = [
        PUBLIC_TOURNAMENTS_CTRL,
        PUBLIC_REGISTRATIONS_CTRL,
        REGISTRATION_SERVICE,
        PUBLIC_MATCHES_CTRL,
      ];
      for (const f of nonOwners) {
        expect(readFileSync(f, 'utf8')).not.toContain("'tournament.bracket_viewed'");
      }
    });

    it('tournament.match_viewed fires only from PublicTournamentMatchesController', () => {
      const ownerSrc = readFileSync(PUBLIC_MATCHES_CTRL, 'utf8');
      expect(ownerSrc).toContain("type: 'tournament.match_viewed'");

      const nonOwners = [
        PUBLIC_TOURNAMENTS_CTRL,
        PUBLIC_REGISTRATIONS_CTRL,
        REGISTRATION_SERVICE,
        PUBLIC_BRACKET_CTRL,
      ];
      for (const f of nonOwners) {
        expect(readFileSync(f, 'utf8')).not.toContain("'tournament.match_viewed'");
      }
    });
  });

  // ─── Payload safety ───────────────────────────────────────────────────────

  describe('analytics payload safety — no PII or secrets in owner files', () => {
    const allOwnerSrc = [
      PUBLIC_TOURNAMENTS_CTRL,
      PUBLIC_REGISTRATIONS_CTRL,
      REGISTRATION_SERVICE,
      PUBLIC_BRACKET_CTRL,
      PUBLIC_MATCHES_CTRL,
    ]
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');

    it('does not include phone numbers in analytics payloads', () => {
      expect(allOwnerSrc).not.toMatch(/phone.*track|track.*phone/i);
      expect(allOwnerSrc).not.toMatch(/phoneNormalized.*track|track.*phoneNormalized/i);
    });

    it('does not include email addresses in analytics payloads', () => {
      expect(allOwnerSrc).not.toMatch(/email.*track|track.*email/i);
    });

    it('does not include access tokens or session data in analytics payloads', () => {
      expect(allOwnerSrc).not.toMatch(/accessToken.*track|track.*accessToken/i);
      expect(allOwnerSrc).not.toMatch(/refreshToken.*track|track.*refreshToken/i);
    });

    it('does not include admin-only fields in public analytics payloads', () => {
      expect(allOwnerSrc).not.toMatch(/adminNote|rejectedReason.*track|track.*rejectedReason/i);
    });

    it('does not hardcode credentials or API keys', () => {
      expect(allOwnerSrc).not.toMatch(/api[_-]?key\s*[:=]\s*['"`]/i);
      expect(allOwnerSrc).not.toMatch(/secret\s*[:=]\s*['"`][^'"`]{8,}/i);
    });

    it('does not hardcode localhost or production domain in runtime code', () => {
      expect(allOwnerSrc).not.toMatch(/localhost:\d+/);
      expect(allOwnerSrc).not.toMatch(/https?:\/\/qesb\.ir/);
    });
  });

  // ─── No analytics dashboard, routes, or settings UI ─────────────────────

  describe('no out-of-scope analytics infrastructure introduced', () => {
    it('no public analytics route exists in owner files', () => {
      const allSrc = [
        PUBLIC_TOURNAMENTS_CTRL,
        PUBLIC_REGISTRATIONS_CTRL,
        REGISTRATION_SERVICE,
        PUBLIC_BRACKET_CTRL,
        PUBLIC_MATCHES_CTRL,
      ]
        .map((f) => readFileSync(f, 'utf8'))
        .join('\n');

      expect(allSrc).not.toMatch(/\/api\/v1\/analytics/);
      expect(allSrc).not.toMatch(/\/admin\/v1\/analytics/);
    });

    it('no public match detail route is created (match_viewed fires from list endpoint only)', () => {
      const matchesSrc = readFileSync(PUBLIC_MATCHES_CTRL, 'utf8');
      // Only a list route (:slug/matches) should exist — no :slug/matches/:matchId route
      expect(matchesSrc).not.toMatch(/:matchId/);
    });
  });

  // ─── Backend-only event firing ────────────────────────────────────────────

  describe('events fire from backend controllers only (not replicated in frontend composables)', () => {
    const WEB_COMPOSABLES_DIR = join(__dirname, '../../../../apps/web/composables');

    it('useTournamentDetail.ts does not fire tournament.viewed client-side', () => {
      const src = readFileSync(join(WEB_COMPOSABLES_DIR, 'useTournamentDetail.ts'), 'utf8');
      expect(src).not.toContain("'tournament.viewed'");
      expect(src).not.toContain('analyticsService');
    });

    it('useTournamentBracket.ts does not fire tournament.bracket_viewed client-side', () => {
      const src = readFileSync(join(WEB_COMPOSABLES_DIR, 'useTournamentBracket.ts'), 'utf8');
      expect(src).not.toContain("'tournament.bracket_viewed'");
      expect(src).not.toContain('analyticsService');
    });

    it('useTournamentMatches.ts does not fire tournament.match_viewed client-side', () => {
      const src = readFileSync(join(WEB_COMPOSABLES_DIR, 'useTournamentMatches.ts'), 'utf8');
      expect(src).not.toContain("'tournament.match_viewed'");
      expect(src).not.toContain('analyticsService');
    });

    it('composables reference server-side implementation in comments (not deferred)', () => {
      const detailSrc = readFileSync(join(WEB_COMPOSABLES_DIR, 'useTournamentDetail.ts'), 'utf8');
      const matchesSrc = readFileSync(join(WEB_COMPOSABLES_DIR, 'useTournamentMatches.ts'), 'utf8');
      const bracketSrc = readFileSync(join(WEB_COMPOSABLES_DIR, 'useTournamentBracket.ts'), 'utf8');
      expect(detailSrc).not.toContain('deferred');
      expect(matchesSrc).not.toContain('deferred');
      expect(bracketSrc).not.toContain('deferred');
    });
  });
});
