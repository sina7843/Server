import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  assertMatchIsCancellable,
  assertMatchIsUpdatable,
  assertTournamentAllowsGeneration,
  assertTournamentAllowsMatchCreate,
  assertTournamentAllowsMatchManagement,
  assertParticipantsAreActiveInTournament,
} from './tournament-match-policy';
import type { TournamentMatchDocument } from './tournament-match.schema';

function makeMatch(overrides: Partial<Record<string, unknown>> = {}): TournamentMatchDocument {
  return {
    _id: new Types.ObjectId(),
    status: 'scheduled',
    ...overrides,
  } as unknown as TournamentMatchDocument;
}

// ─── assertMatchIsCancellable ─────────────────────────────────────────────────

describe('assertMatchIsCancellable', () => {
  it.each(['scheduled', 'in_progress'])('allows cancellation when status is %s', (status) => {
    expect(() => assertMatchIsCancellable(makeMatch({ status }))).not.toThrow();
  });

  it.each(['completed', 'cancelled'])('throws when status is %s', (status) => {
    expect(() => assertMatchIsCancellable(makeMatch({ status }))).toThrow(BadRequestException);
  });
});

// ─── assertMatchIsUpdatable ───────────────────────────────────────────────────

describe('assertMatchIsUpdatable', () => {
  it.each(['scheduled', 'in_progress'])('allows update when status is %s', (status) => {
    expect(() => assertMatchIsUpdatable(makeMatch({ status }))).not.toThrow();
  });

  it('throws when match is cancelled', () => {
    expect(() => assertMatchIsUpdatable(makeMatch({ status: 'cancelled' }))).toThrow(
      BadRequestException,
    );
  });

  it('throws when match is completed', () => {
    expect(() => assertMatchIsUpdatable(makeMatch({ status: 'completed' }))).toThrow(
      BadRequestException,
    );
  });
});

// ─── assertTournamentAllowsGeneration ────────────────────────────────────────

describe('assertTournamentAllowsGeneration', () => {
  it.each(['registration_closed', 'in_progress'])(
    'allows generation when status is %s',
    (status) => {
      expect(() =>
        assertTournamentAllowsGeneration(status as never, 'single_elimination'),
      ).not.toThrow();
    },
  );

  it.each(['draft', 'published', 'registration_open', 'completed', 'cancelled'])(
    'throws when tournament status is %s',
    (status) => {
      expect(() => assertTournamentAllowsGeneration(status as never, 'single_elimination')).toThrow(
        BadRequestException,
      );
    },
  );

  it.each(['single_elimination', 'round_robin'])('allows generatable format %s', (format) => {
    expect(() => assertTournamentAllowsGeneration('in_progress', format as never)).not.toThrow();
  });

  it('throws for manual format', () => {
    expect(() => assertTournamentAllowsGeneration('in_progress', 'manual')).toThrow(
      BadRequestException,
    );
  });
});

// ─── assertTournamentAllowsMatchCreate ───────────────────────────────────────

describe('assertTournamentAllowsMatchCreate', () => {
  it.each(['registration_closed', 'in_progress'])(
    'allows manual match creation when status is %s',
    (status) => {
      expect(() => assertTournamentAllowsMatchCreate(status as never)).not.toThrow();
    },
  );

  it.each(['draft', 'published', 'registration_open', 'completed', 'cancelled'])(
    'throws when tournament status is %s',
    (status) => {
      expect(() => assertTournamentAllowsMatchCreate(status as never)).toThrow(BadRequestException);
    },
  );

  it('error message mentions registration_closed and in_progress', () => {
    try {
      assertTournamentAllowsMatchCreate('draft' as never);
      fail('expected to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect((e as BadRequestException).message).toContain('registration_closed');
      expect((e as BadRequestException).message).toContain('in_progress');
    }
  });
});

// ─── assertTournamentAllowsMatchManagement ───────────────────────────────────

describe('assertTournamentAllowsMatchManagement', () => {
  it.each(['registration_closed', 'in_progress'])(
    'allows match management when status is %s',
    (status) => {
      expect(() => assertTournamentAllowsMatchManagement(status as never)).not.toThrow();
    },
  );

  it.each(['draft', 'published', 'registration_open', 'completed', 'cancelled'])(
    'throws when tournament status is %s',
    (status) => {
      expect(() => assertTournamentAllowsMatchManagement(status as never)).toThrow(
        BadRequestException,
      );
    },
  );
});

// ─── assertParticipantsAreActiveInTournament ─────────────────────────────────

describe('assertParticipantsAreActiveInTournament', () => {
  const P1 = new Types.ObjectId('507f1f77bcf86cd799439001');
  const P2 = new Types.ObjectId('507f1f77bcf86cd799439002');

  function makeActiveSet(...ids: Types.ObjectId[]): ReadonlySet<string> {
    return new Set(ids.map(String));
  }

  it('does not throw when all participant IDs are in active set', () => {
    const activeSet = makeActiveSet(P1, P2);
    expect(() => assertParticipantsAreActiveInTournament(activeSet, P1, P2)).not.toThrow();
  });

  it('does not throw when participant IDs are null or undefined (no assignment)', () => {
    const activeSet = makeActiveSet(P1);
    expect(() => assertParticipantsAreActiveInTournament(activeSet, null, undefined)).not.toThrow();
  });

  it('throws when a participant is not in the active set', () => {
    const activeSet = makeActiveSet(P1);
    expect(() => assertParticipantsAreActiveInTournament(activeSet, P1, P2)).toThrow(
      BadRequestException,
    );
  });

  it('throws for cross-tournament participant (not in active set)', () => {
    const foreignId = new Types.ObjectId('507f1f77bcf86cd799439099');
    const activeSet = makeActiveSet(P1);
    expect(() => assertParticipantsAreActiveInTournament(activeSet, foreignId)).toThrow(
      BadRequestException,
    );
  });

  it('accepts string IDs in addition to ObjectId', () => {
    const activeSet = makeActiveSet(P1);
    expect(() => assertParticipantsAreActiveInTournament(activeSet, String(P1))).not.toThrow();
  });

  it('throws with a message containing the invalid participant ID', () => {
    const activeSet = makeActiveSet(P1);
    try {
      assertParticipantsAreActiveInTournament(activeSet, P2);
      fail('expected to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect((e as BadRequestException).message).toContain(String(P2));
    }
  });

  it('no args throws nothing', () => {
    const activeSet = makeActiveSet();
    expect(() => assertParticipantsAreActiveInTournament(activeSet)).not.toThrow();
  });
});
