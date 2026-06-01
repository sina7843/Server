import { UnprocessableEntityException, BadRequestException } from '@nestjs/common';
import {
  PHASE1_TOURNAMENT_STATUSES,
  PHASE1_TOURNAMENT_FORMATS,
  isValidTournamentStatus,
  isValidTournamentFormat,
  canTransition,
  assertTransition,
} from './tournament-policy';
import {
  assertTournamentTitle,
  assertTournamentGameId,
  assertTournamentFormat,
  assertTournamentStatus,
  assertTournamentCapacity,
  assertRegistrationWindow,
  assertTournamentSchedule,
} from './tournament-validation';

// ─── Status allowlist ─────────────────────────────────────────────────────────

describe('PHASE1_TOURNAMENT_STATUSES', () => {
  it('contains exactly the 8 locked statuses', () => {
    expect([...PHASE1_TOURNAMENT_STATUSES].sort()).toEqual(
      [
        'archived',
        'cancelled',
        'completed',
        'draft',
        'in_progress',
        'published',
        'registration_closed',
        'registration_open',
      ].sort(),
    );
  });

  it('does not contain alias statuses', () => {
    const aliases = ['open', 'closed', 'active', 'inactive', 'published_open'];
    for (const alias of aliases) {
      expect(PHASE1_TOURNAMENT_STATUSES).not.toContain(alias);
    }
  });
});

describe('isValidTournamentStatus', () => {
  it('returns true for all locked statuses', () => {
    for (const s of PHASE1_TOURNAMENT_STATUSES) {
      expect(isValidTournamentStatus(s)).toBe(true);
    }
  });

  it('returns false for invalid statuses', () => {
    expect(isValidTournamentStatus('open')).toBe(false);
    expect(isValidTournamentStatus('active')).toBe(false);
    expect(isValidTournamentStatus('closed')).toBe(false);
    expect(isValidTournamentStatus('inactive')).toBe(false);
    expect(isValidTournamentStatus('published_open')).toBe(false);
    expect(isValidTournamentStatus('')).toBe(false);
    expect(isValidTournamentStatus('DRAFT')).toBe(false);
  });
});

// ─── Format allowlist ─────────────────────────────────────────────────────────

describe('PHASE1_TOURNAMENT_FORMATS', () => {
  it('contains exactly the 3 Phase 1 supported formats', () => {
    expect([...PHASE1_TOURNAMENT_FORMATS].sort()).toEqual(
      ['manual', 'round_robin', 'single_elimination'].sort(),
    );
  });

  it('does not contain unsupported future formats', () => {
    const unsupported = ['swiss', 'double_elimination', 'advanced_bracket_editor'];
    for (const f of unsupported) {
      expect(PHASE1_TOURNAMENT_FORMATS).not.toContain(f);
    }
  });
});

describe('isValidTournamentFormat', () => {
  it('returns true for all Phase 1 supported formats', () => {
    for (const f of PHASE1_TOURNAMENT_FORMATS) {
      expect(isValidTournamentFormat(f)).toBe(true);
    }
  });

  it('returns false for swiss', () => {
    expect(isValidTournamentFormat('swiss')).toBe(false);
  });

  it('returns false for double_elimination', () => {
    expect(isValidTournamentFormat('double_elimination')).toBe(false);
  });

  it('returns false for advanced_bracket_editor', () => {
    expect(isValidTournamentFormat('advanced_bracket_editor')).toBe(false);
  });

  it('returns false for empty string and garbage values', () => {
    expect(isValidTournamentFormat('')).toBe(false);
    expect(isValidTournamentFormat('Single_Elimination')).toBe(false);
  });
});

// ─── Lifecycle transitions — canTransition ────────────────────────────────────

describe('canTransition — legal forward path', () => {
  it('draft -> published', () => expect(canTransition('draft', 'published')).toBe(true));
  it('published -> registration_open', () =>
    expect(canTransition('published', 'registration_open')).toBe(true));
  it('registration_open -> registration_closed', () =>
    expect(canTransition('registration_open', 'registration_closed')).toBe(true));
  it('registration_closed -> in_progress', () =>
    expect(canTransition('registration_closed', 'in_progress')).toBe(true));
  it('in_progress -> completed', () =>
    expect(canTransition('in_progress', 'completed')).toBe(true));
});

describe('canTransition — legal cancellation', () => {
  it('draft -> cancelled', () => expect(canTransition('draft', 'cancelled')).toBe(true));
  it('published -> cancelled', () => expect(canTransition('published', 'cancelled')).toBe(true));
  it('registration_open -> cancelled', () =>
    expect(canTransition('registration_open', 'cancelled')).toBe(true));
  it('registration_closed -> cancelled', () =>
    expect(canTransition('registration_closed', 'cancelled')).toBe(true));
  it('in_progress -> cancelled', () =>
    expect(canTransition('in_progress', 'cancelled')).toBe(true));
});

describe('canTransition — legal archival', () => {
  it('draft -> archived', () => expect(canTransition('draft', 'archived')).toBe(true));
  it('completed -> archived', () => expect(canTransition('completed', 'archived')).toBe(true));
  it('cancelled -> archived', () => expect(canTransition('cancelled', 'archived')).toBe(true));
});

describe('canTransition — illegal transitions', () => {
  it('completed -> in_progress is rejected', () =>
    expect(canTransition('completed', 'in_progress')).toBe(false));

  it('cancelled -> in_progress is rejected', () =>
    expect(canTransition('cancelled', 'in_progress')).toBe(false));

  it('archived -> draft is rejected', () => expect(canTransition('archived', 'draft')).toBe(false));

  it('archived -> published is rejected', () =>
    expect(canTransition('archived', 'published')).toBe(false));

  it('archived -> registration_open is rejected', () =>
    expect(canTransition('archived', 'registration_open')).toBe(false));

  it('archived -> in_progress is rejected', () =>
    expect(canTransition('archived', 'in_progress')).toBe(false));

  it('archived -> cancelled is rejected', () =>
    expect(canTransition('archived', 'cancelled')).toBe(false));

  it('registration_open -> completed directly is rejected', () =>
    expect(canTransition('registration_open', 'completed')).toBe(false));

  it('draft -> in_progress directly is rejected', () =>
    expect(canTransition('draft', 'in_progress')).toBe(false));

  it('draft -> registration_open directly is rejected', () =>
    expect(canTransition('draft', 'registration_open')).toBe(false));

  it('completed -> draft is rejected', () =>
    expect(canTransition('completed', 'draft')).toBe(false));
});

describe('assertTransition', () => {
  it('does not throw for legal transitions', () => {
    expect(() => assertTransition('draft', 'published')).not.toThrow();
    expect(() => assertTransition('in_progress', 'completed')).not.toThrow();
    expect(() => assertTransition('cancelled', 'archived')).not.toThrow();
  });

  it('throws UnprocessableEntityException for illegal transitions', () => {
    expect(() => assertTransition('completed', 'in_progress')).toThrow(
      UnprocessableEntityException,
    );
    expect(() => assertTransition('archived', 'draft')).toThrow(UnprocessableEntityException);
    expect(() => assertTransition('draft', 'in_progress')).toThrow(UnprocessableEntityException);
  });
});

// ─── Validation helpers ───────────────────────────────────────────────────────

describe('assertTournamentTitle', () => {
  it('accepts a valid non-empty title', () => {
    expect(() => assertTournamentTitle('Dragon Cup 2026')).not.toThrow();
  });

  it('rejects empty string', () => {
    expect(() => assertTournamentTitle('')).toThrow(BadRequestException);
  });

  it('rejects whitespace-only string', () => {
    expect(() => assertTournamentTitle('   ')).toThrow(BadRequestException);
  });

  it('rejects undefined', () => {
    expect(() => assertTournamentTitle(undefined)).toThrow(BadRequestException);
  });

  it('rejects null', () => {
    expect(() => assertTournamentTitle(null)).toThrow(BadRequestException);
  });
});

describe('assertTournamentGameId', () => {
  it('accepts a valid non-empty gameId', () => {
    expect(() => assertTournamentGameId('507f1f77bcf86cd799439012')).not.toThrow();
  });

  it('rejects empty string', () => {
    expect(() => assertTournamentGameId('')).toThrow(BadRequestException);
  });

  it('rejects undefined', () => {
    expect(() => assertTournamentGameId(undefined)).toThrow(BadRequestException);
  });
});

describe('assertTournamentFormat', () => {
  it('accepts single_elimination', () => {
    expect(() => assertTournamentFormat('single_elimination')).not.toThrow();
  });

  it('accepts round_robin', () => {
    expect(() => assertTournamentFormat('round_robin')).not.toThrow();
  });

  it('accepts manual', () => {
    expect(() => assertTournamentFormat('manual')).not.toThrow();
  });

  it('rejects swiss', () => {
    expect(() => assertTournamentFormat('swiss')).toThrow(UnprocessableEntityException);
  });

  it('rejects double_elimination', () => {
    expect(() => assertTournamentFormat('double_elimination')).toThrow(
      UnprocessableEntityException,
    );
  });

  it('rejects advanced_bracket_editor', () => {
    expect(() => assertTournamentFormat('advanced_bracket_editor')).toThrow(
      UnprocessableEntityException,
    );
  });

  it('rejects empty string', () => {
    expect(() => assertTournamentFormat('')).toThrow(UnprocessableEntityException);
  });

  it('rejects undefined', () => {
    expect(() => assertTournamentFormat(undefined)).toThrow(UnprocessableEntityException);
  });
});

describe('assertTournamentStatus', () => {
  it('accepts all locked statuses', () => {
    for (const s of PHASE1_TOURNAMENT_STATUSES) {
      expect(() => assertTournamentStatus(s)).not.toThrow();
    }
  });

  it('rejects open', () => {
    expect(() => assertTournamentStatus('open')).toThrow(UnprocessableEntityException);
  });

  it('rejects active', () => {
    expect(() => assertTournamentStatus('active')).toThrow(UnprocessableEntityException);
  });

  it('rejects undefined', () => {
    expect(() => assertTournamentStatus(undefined)).toThrow(UnprocessableEntityException);
  });
});

describe('assertTournamentCapacity', () => {
  it('accepts a positive integer', () => {
    expect(() => assertTournamentCapacity(64)).not.toThrow();
    expect(() => assertTournamentCapacity(1)).not.toThrow();
  });

  it('rejects 0', () => {
    expect(() => assertTournamentCapacity(0)).toThrow(BadRequestException);
  });

  it('rejects negative numbers', () => {
    expect(() => assertTournamentCapacity(-1)).toThrow(BadRequestException);
  });

  it('rejects non-integer floats', () => {
    expect(() => assertTournamentCapacity(64.5)).toThrow(BadRequestException);
  });

  it('rejects strings', () => {
    expect(() => assertTournamentCapacity('64')).toThrow(BadRequestException);
  });

  it('rejects undefined', () => {
    expect(() => assertTournamentCapacity(undefined)).toThrow(BadRequestException);
  });
});

describe('assertRegistrationWindow', () => {
  it('accepts when open is before close', () => {
    const open = new Date('2026-01-01');
    const close = new Date('2026-02-01');
    expect(() => assertRegistrationWindow(open, close)).not.toThrow();
  });

  it('rejects when close is equal to open', () => {
    const t = new Date('2026-01-01');
    expect(() => assertRegistrationWindow(t, t)).toThrow(UnprocessableEntityException);
  });

  it('rejects when close is before open', () => {
    const open = new Date('2026-02-01');
    const close = new Date('2026-01-01');
    expect(() => assertRegistrationWindow(open, close)).toThrow(UnprocessableEntityException);
  });

  it('passes when only open is provided', () => {
    expect(() => assertRegistrationWindow(new Date(), undefined)).not.toThrow();
  });

  it('passes when only close is provided', () => {
    expect(() => assertRegistrationWindow(undefined, new Date())).not.toThrow();
  });

  it('passes when neither is provided', () => {
    expect(() => assertRegistrationWindow(undefined, undefined)).not.toThrow();
  });
});

describe('assertTournamentSchedule', () => {
  it('accepts when startsAt is before endsAt', () => {
    expect(() =>
      assertTournamentSchedule(new Date('2026-03-01'), new Date('2026-04-01')),
    ).not.toThrow();
  });

  it('rejects when endsAt equals startsAt', () => {
    const t = new Date('2026-03-01');
    expect(() => assertTournamentSchedule(t, t)).toThrow(UnprocessableEntityException);
  });

  it('rejects when endsAt is before startsAt', () => {
    expect(() => assertTournamentSchedule(new Date('2026-04-01'), new Date('2026-03-01'))).toThrow(
      UnprocessableEntityException,
    );
  });

  it('passes when only startsAt is provided', () => {
    expect(() => assertTournamentSchedule(new Date(), undefined)).not.toThrow();
  });

  it('passes when neither is provided', () => {
    expect(() => assertTournamentSchedule(undefined, undefined)).not.toThrow();
  });
});
