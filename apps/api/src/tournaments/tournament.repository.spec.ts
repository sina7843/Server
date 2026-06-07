import { TournamentRepository } from './tournament.repository';
import { InvalidTournamentFilterError } from './tournament.types';

// Builds a fake chainable Mongoose query that captures the filter passed to find().
function makeModelMock() {
  const capturedQuery: { filter?: unknown; countFilter?: unknown } = {};

  const execChain = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  const countExec = { exec: jest.fn().mockResolvedValue(0) };

  const model = {
    find: jest.fn((filter: unknown) => {
      capturedQuery.filter = filter;
      return execChain;
    }),
    countDocuments: jest.fn((filter: unknown) => {
      capturedQuery.countFilter = filter;
      return countExec;
    }),
    findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    create: jest.fn().mockResolvedValue({}),
  };

  return { model, capturedQuery };
}

describe('TournamentRepository — registrationOpen filter', () => {
  it('registrationOpen=true sets status=registration_open and window $and conditions', async () => {
    const { model, capturedQuery } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await repo.list({ registrationOpen: true });

    const filter = capturedQuery.filter as Record<string, unknown>;
    expect(filter.status).toBe('registration_open');
    expect(Array.isArray(filter.$and)).toBe(true);
    const andClauses = filter.$and as unknown[];
    expect(andClauses.length).toBeGreaterThanOrEqual(2);
  });

  it('registrationOpen=false adds $and condition excluding registration_open', async () => {
    const { model, capturedQuery } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await repo.list({ registrationOpen: false });

    const filter = capturedQuery.filter as Record<string, unknown>;
    // No status pin — exclusion is expressed via $and
    expect(filter.status).toBeUndefined();
    expect(Array.isArray(filter.$and)).toBe(true);
    const andClauses = filter.$and as Array<Record<string, unknown>>;
    // The $and must contain an $or that excludes registration_open
    const notOpenClause = andClauses.find(
      (c) => Array.isArray(c.$or) && JSON.stringify(c.$or).includes('registration_open'),
    );
    expect(notOpenClause).toBeDefined();
    const orBranches = notOpenClause!.$or as Array<Record<string, unknown>>;
    const statusNeBranch = orBranches.find(
      (b) =>
        b.status !== undefined &&
        typeof b.status === 'object' &&
        (b.status as Record<string, unknown>).$ne === 'registration_open',
    );
    expect(statusNeBranch).toBeDefined();
  });

  it('registrationOpen=false composes with statuses restriction (public-safety preserved)', async () => {
    const { model, capturedQuery } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await repo.list({
      registrationOpen: false,
      statuses: ['published', 'registration_closed', 'completed'],
    });

    const filter = capturedQuery.filter as Record<string, unknown>;
    // statuses filter still applies
    expect(filter.status).toEqual({ $in: ['published', 'registration_closed', 'completed'] });
    // AND the not-open condition is also applied
    expect(Array.isArray(filter.$and)).toBe(true);
  });

  it('missing registrationOpen does not add any $and condition for registration state', async () => {
    const { model, capturedQuery } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await repo.list({});

    const filter = capturedQuery.filter as Record<string, unknown>;
    // No $and should be present from registrationOpen logic
    expect(filter.$and).toBeUndefined();
    expect(filter.status).toBeUndefined();
  });

  it('registrationOpen=true does not reach the false branch', async () => {
    const { model, capturedQuery } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await repo.list({ registrationOpen: true });

    const filter = capturedQuery.filter as Record<string, unknown>;
    expect(filter.status).toBe('registration_open');
    const andClauses = (filter.$and ?? []) as Array<Record<string, unknown>>;
    const hasNotOpenClause = andClauses.some(
      (c) => Array.isArray(c.$or) && JSON.stringify(c.$or).includes('"$ne"'),
    );
    expect(hasNotOpenClause).toBe(false);
  });

  it('registrationOpen=true with explicit status=registration_open does not override status', async () => {
    const { model, capturedQuery } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await repo.list({ status: 'registration_open', registrationOpen: true });

    const filter = capturedQuery.filter as Record<string, unknown>;
    // Must still be 'registration_open' (same value) — not discarded or changed.
    expect(filter.status).toBe('registration_open');
  });

  it('registrationOpen=true uses the shared REGISTRATION_OPEN_STATUS constant (string equality)', async () => {
    const { model, capturedQuery } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await repo.list({ registrationOpen: true });

    const filter = capturedQuery.filter as Record<string, unknown>;
    // Verify the repository sets the status to the exact shared constant value.
    expect(filter.status).toBe('registration_open');
  });

  it('registrationOpen=false $ne clause uses the same status string as the true branch', async () => {
    const { model, capturedQuery } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await repo.list({ registrationOpen: false });

    const filter = capturedQuery.filter as Record<string, unknown>;
    const andClauses = filter.$and as Array<Record<string, unknown>>;
    const notOpenClause = andClauses.find(
      (c) => Array.isArray(c.$or) && JSON.stringify(c.$or).includes('registration_open'),
    );
    expect(notOpenClause).toBeDefined();
    const orBranches = notOpenClause!.$or as Array<Record<string, unknown>>;
    const neValue = (
      orBranches.find(
        (b) =>
          b.status !== undefined &&
          typeof b.status === 'object' &&
          '$ne' in (b.status as Record<string, unknown>),
      )?.status as Record<string, unknown> | undefined
    )?.$ne;
    // Both branches must use the identical status string.
    expect(neValue).toBe('registration_open');
  });
});


describe('TournamentRepository — half-open registration window boundary (registrationOpenAt <= now < registrationCloseAt)', () => {
  it('registrationOpen=true uses $gt for registrationCloseAt (half-open: close is strictly after now)', async () => {
    const { model, capturedQuery } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await repo.list({ registrationOpen: true });

    const filter = capturedQuery.filter as Record<string, unknown>;
    const andClauses = filter.$and as Array<Record<string, unknown>>;
    const closeClause = andClauses.find(
      (c) => Array.isArray(c.$or) && JSON.stringify(c.$or).includes('registrationCloseAt'),
    );
    expect(closeClause).toBeDefined();
    const closeOr = closeClause!.$or as Array<Record<string, unknown>>;
    const closeWindowBranch = closeOr.find(
      (b) =>
        b.registrationCloseAt !== undefined &&
        typeof b.registrationCloseAt === 'object' &&
        '$gt' in (b.registrationCloseAt as Record<string, unknown>),
    );
    expect(closeWindowBranch).toBeDefined();
    const noBoundaryInclusive = closeOr.find(
      (b) =>
        b.registrationCloseAt !== undefined &&
        typeof b.registrationCloseAt === 'object' &&
        '$gte' in (b.registrationCloseAt as Record<string, unknown>),
    );
    expect(noBoundaryInclusive).toBeUndefined();
  });

  it('registrationOpen=false uses $lte for registrationCloseAt (half-open: close at-or-before now = closed)', async () => {
    const { model, capturedQuery } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await repo.list({ registrationOpen: false });

    const filter = capturedQuery.filter as Record<string, unknown>;
    const andClauses = filter.$and as Array<Record<string, unknown>>;
    const notOpenClause = andClauses.find(
      (c) => Array.isArray(c.$or) && JSON.stringify(c.$or).includes('registration_open'),
    );
    expect(notOpenClause).toBeDefined();
    const orBranches = notOpenClause!.$or as Array<Record<string, unknown>>;
    const closeWindowBranch = orBranches.find(
      (b) =>
        b.registrationCloseAt !== undefined &&
        typeof b.registrationCloseAt === 'object' &&
        '$lte' in (b.registrationCloseAt as Record<string, unknown>),
    );
    expect(closeWindowBranch).toBeDefined();
    const noBoundaryExclusive = orBranches.find(
      (b) =>
        b.registrationCloseAt !== undefined &&
        typeof b.registrationCloseAt === 'object' &&
        '$lt' in (b.registrationCloseAt as Record<string, unknown>),
    );
    expect(noBoundaryExclusive).toBeUndefined();
  });

  it('registrationOpen=true uses $lte for registrationOpenAt (open time is inclusive)', async () => {
    const { model, capturedQuery } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await repo.list({ registrationOpen: true });

    const filter = capturedQuery.filter as Record<string, unknown>;
    const andClauses = filter.$and as Array<Record<string, unknown>>;
    const openClause = andClauses.find(
      (c) => Array.isArray(c.$or) && JSON.stringify(c.$or).includes('registrationOpenAt'),
    );
    expect(openClause).toBeDefined();
    const openOr = openClause!.$or as Array<Record<string, unknown>>;
    const openWindowBranch = openOr.find(
      (b) =>
        b.registrationOpenAt !== undefined &&
        typeof b.registrationOpenAt === 'object' &&
        '$lte' in (b.registrationOpenAt as Record<string, unknown>),
    );
    expect(openWindowBranch).toBeDefined();
  });

  it('registrationOpen=true and false close-boundary operators are complementary ($gt vs $lte)', async () => {
    const { model: m1, capturedQuery: q1 } = makeModelMock();
    const repo1 = new TournamentRepository(m1 as never);
    await repo1.list({ registrationOpen: true });

    const { model: m2, capturedQuery: q2 } = makeModelMock();
    const repo2 = new TournamentRepository(m2 as never);
    await repo2.list({ registrationOpen: false });

    const trueAnd = (q1.filter as Record<string, unknown>).$and as Array<Record<string, unknown>>;
    const falseAnd = (q2.filter as Record<string, unknown>).$and as Array<Record<string, unknown>>;

    // Find the branch inside each $or clause that specifically tests registrationCloseAt with a date.
    function findCloseBranch(andClauses: Array<Record<string, unknown>>) {
      for (const clause of andClauses) {
        if (!Array.isArray(clause.$or)) continue;
        for (const branch of clause.$or as Array<Record<string, unknown>>) {
          const close = branch.registrationCloseAt as Record<string, unknown> | undefined;
          if (close && ('$gt' in close || '$lte' in close || '$gte' in close || '$lt' in close)) {
            return close;
          }
        }
      }
      return undefined;
    }

    const trueCloseBranch = findCloseBranch(trueAnd);
    const falseCloseBranch = findCloseBranch(falseAnd);

    // Half-open policy: true uses $gt (strictly after now), false uses $lte (at-or-before now).
    expect(trueCloseBranch).toBeDefined();
    expect('$gt' in trueCloseBranch!).toBe(true);
    expect('$gte' in trueCloseBranch!).toBe(false);

    expect(falseCloseBranch).toBeDefined();
    expect('$lte' in falseCloseBranch!).toBe(true);
    expect('$lt' in falseCloseBranch!).toBe(false);
  });
});

// ─── Repository defense-in-depth — direct caller contradictions ───────────────

describe('TournamentRepository — defense-in-depth for contradictory scalar filters', () => {
  it('throws InvalidTournamentFilterError for status=registration_open + registrationOpen=false', async () => {
    const { model } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await expect(
      repo.list({ status: 'registration_open', registrationOpen: false }),
    ).rejects.toThrow(InvalidTournamentFilterError);
  });

  it('throws InvalidTournamentFilterError for status=published + registrationOpen=true', async () => {
    const { model } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await expect(
      repo.list({ status: 'published', registrationOpen: true }),
    ).rejects.toThrow(InvalidTournamentFilterError);
  });

  it('throws InvalidTournamentFilterError for status=cancelled + registrationOpen=true', async () => {
    const { model } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await expect(
      repo.list({ status: 'cancelled', registrationOpen: true }),
    ).rejects.toThrow(InvalidTournamentFilterError);
  });

  it('domain error message names the conflicting filter', async () => {
    const { model } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await expect(
      repo.list({ status: 'published', registrationOpen: true }),
    ).rejects.toThrow('status=published cannot be combined with registrationOpen=true');
  });

  it('does NOT throw for status=registration_open + registrationOpen=true (allowed)', async () => {
    const { model } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await expect(repo.list({ status: 'registration_open', registrationOpen: true })).resolves.toBeDefined();
  });

  it('does NOT throw for status=published + registrationOpen=false (allowed)', async () => {
    const { model } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await expect(repo.list({ status: 'published', registrationOpen: false })).resolves.toBeDefined();
  });

  it('does NOT throw for statuses[] + registrationOpen=false (internal array — not over-blocked)', async () => {
    const { model } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    await expect(
      repo.list({
        statuses: ['published', 'registration_open', 'completed'],
        registrationOpen: false,
      }),
    ).resolves.toBeDefined();
  });

  it('does NOT throw NestJS HttpException — only throws domain error', async () => {
    const { model } = makeModelMock();
    const repo = new TournamentRepository(model as never);

    try {
      await repo.list({ status: 'published', registrationOpen: true });
      fail('Expected an error to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidTournamentFilterError);
      // Must not be a NestJS HTTP exception (those have a 'status' property and 'getStatus').
      expect(typeof (err as Record<string, unknown>).getStatus).not.toBe('function');
    }
  });
});
