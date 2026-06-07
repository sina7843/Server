import { TournamentRepository } from './tournament.repository';

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
    // For registrationOpen=true, status is pinned to registration_open (not excluded)
    expect(filter.status).toBe('registration_open');
    const andClauses = (filter.$and ?? []) as Array<Record<string, unknown>>;
    // None of the $and clauses should contain a $ne: registration_open condition
    const hasNotOpenClause = andClauses.some(
      (c) => Array.isArray(c.$or) && JSON.stringify(c.$or).includes('"$ne"'),
    );
    expect(hasNotOpenClause).toBe(false);
  });
});
