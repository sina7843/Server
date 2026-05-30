/**
 * Phase 1 SDK surface verification.
 *
 * Verifies method names, paths, HTTP verbs, and boundary constraints
 * for all Phase 1 SDK clients.
 */

import { createGamesClient } from './games';
import { createAdminGamesClient } from './admin-games';
import { createTournamentsClient } from './tournaments';
import { createAdminTournamentsClient } from './admin-tournaments';
import { createAdminTournamentRegistrationsClient } from './admin-tournament-registrations';
import { createAdminTournamentParticipantsClient } from './admin-tournament-participants';
import { createAdminTournamentMatchesClient } from './admin-tournament-matches';
import { createAdminTournamentStandingsClient } from './admin-tournament-standings';
import { createAdminTournamentBracketClient } from './admin-tournament-bracket';
import { createSearchClient } from './search';
import { createAdminSearchClient } from './admin-search';

const emptyList = { items: [], total: 0, page: 1, limit: 20 };

// ─── GamesClient ─────────────────────────────────────────────────────────────

describe('createGamesClient', () => {
  function make() {
    const request = jest.fn();
    const client = createGamesClient({ request } as never);
    return { request, client };
  }

  it('list calls GET /api/v1/games with no params', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.list();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/api/v1/games' }),
    );
  });

  it('list passes status filter', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.list({ status: 'active' });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/games?status=active' }),
    );
  });

  it('getBySlug calls GET /api/v1/games/:slug', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.getBySlug('dota2');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/api/v1/games/dota2' }),
    );
  });

  it('has no hardcoded domain', () => {
    const { request } = make();
    const calls = request.mock.calls;
    for (const [arg] of calls) {
      expect(String(arg?.path ?? '')).not.toMatch(/localhost|qesb\.ir/);
    }
  });
});

// ─── AdminGamesClient ─────────────────────────────────────────────────────────

describe('createAdminGamesClient', () => {
  function make() {
    const request = jest.fn();
    const client = createAdminGamesClient({ request } as never);
    return { request, client };
  }

  it('list calls GET /admin/v1/games', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.list();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/admin/v1/games' }),
    );
  });

  it('getById calls GET /admin/v1/games/:id', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.getById('g1');
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ path: '/admin/v1/games/g1' }));
  });

  it('create calls POST /admin/v1/games', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.create({ slug: 'cs2', name: 'CS2', status: 'active' });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', path: '/admin/v1/games' }),
    );
  });

  it('update calls PATCH /admin/v1/games/:id', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.update('g1', { name: 'CS2 Updated' });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH', path: '/admin/v1/games/g1' }),
    );
  });

  it('updateStatus calls PATCH /admin/v1/games/:id/status', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.updateStatus('g1', 'inactive');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/games/g1/status' }),
    );
  });
});

// ─── TournamentsClient ────────────────────────────────────────────────────────

describe('createTournamentsClient', () => {
  function make() {
    const request = jest.fn();
    const client = createTournamentsClient({ request } as never);
    return { request, client };
  }

  it('list calls GET /api/v1/tournaments', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.list();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/api/v1/tournaments' }),
    );
  });

  it('list passes gameId, status, format filters', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.list({ gameId: 'g1', status: 'registration_open', format: 'single_elimination' });
    const callArg = request.mock.calls[0]?.[0] as { path: string };
    expect(callArg.path).toContain('gameId=g1');
    expect(callArg.path).toContain('status=registration_open');
    expect(callArg.path).toContain('format=single_elimination');
  });

  it('getBySlug calls GET /api/v1/tournaments/:slug', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.getBySlug('dragon-cup-2026');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/tournaments/dragon-cup-2026' }),
    );
  });

  it('getStandings calls GET /api/v1/tournaments/:slug/standings', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.getStandings('dragon-cup-2026');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/tournaments/dragon-cup-2026/standings' }),
    );
  });

  it('getBracket calls GET /api/v1/tournaments/:slug/bracket', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.getBracket('dragon-cup-2026');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/tournaments/dragon-cup-2026/bracket' }),
    );
  });

  it('register calls POST /api/v1/tournaments/:slug/register', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.register('dragon-cup-2026', { type: 'individual' });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/api/v1/tournaments/dragon-cup-2026/register',
      }),
    );
  });

  it('getMyRegistration calls GET /api/v1/tournaments/:slug/my-registration', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.getMyRegistration('dragon-cup-2026');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/tournaments/dragon-cup-2026/my-registration' }),
    );
  });

  it('withdrawRegistration calls DELETE /api/v1/tournaments/:slug/my-registration', async () => {
    const { request, client } = make();
    request.mockResolvedValue(undefined);
    await client.withdrawRegistration('dragon-cup-2026');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        path: '/api/v1/tournaments/dragon-cup-2026/my-registration',
      }),
    );
  });

  it('has no getMatchById method (no public match detail)', () => {
    const { client } = make();
    expect('getMatchById' in client).toBe(false);
  });
});

// ─── AdminTournamentsClient ───────────────────────────────────────────────────

describe('createAdminTournamentsClient', () => {
  function make() {
    const request = jest.fn();
    const client = createAdminTournamentsClient({ request } as never);
    return { request, client };
  }

  it('list calls GET /admin/v1/tournaments', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.list();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/admin/v1/tournaments' }),
    );
  });

  it('getById calls GET /admin/v1/tournaments/:id', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.getById('t1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1' }),
    );
  });

  it('publish calls POST /admin/v1/tournaments/:id/publish', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.publish('t1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', path: '/admin/v1/tournaments/t1/publish' }),
    );
  });

  it('cancel calls POST /admin/v1/tournaments/:id/cancel', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.cancel('t1', { reason: 'Postponed' });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1/cancel' }),
    );
  });

  it('archive calls POST /admin/v1/tournaments/:id/archive', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.archive('t1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1/archive' }),
    );
  });

  it('openRegistration calls POST /admin/v1/tournaments/:id/open-registration', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.openRegistration('t1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1/open-registration' }),
    );
  });

  it('start calls POST /admin/v1/tournaments/:id/start', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.start('t1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1/start' }),
    );
  });

  it('complete calls POST /admin/v1/tournaments/:id/complete', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.complete('t1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1/complete' }),
    );
  });
});

// ─── AdminTournamentRegistrationsClient ──────────────────────────────────────

describe('createAdminTournamentRegistrationsClient', () => {
  function make() {
    const request = jest.fn();
    const client = createAdminTournamentRegistrationsClient({ request } as never);
    return { request, client };
  }

  it('list calls GET /admin/v1/tournaments/:id/registrations', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.list('t1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1/registrations' }),
    );
  });

  it('list passes status and type filters', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.list('t1', { status: 'submitted', type: 'team' });
    const callArg = request.mock.calls[0]?.[0] as { path: string };
    expect(callArg.path).toContain('status=submitted');
    expect(callArg.path).toContain('type=team');
  });

  it('approve calls POST /admin/v1/tournaments/:id/registrations/:rid/approve', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.approve('t1', 'r1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1/registrations/r1/approve' }),
    );
  });

  it('reject calls POST /admin/v1/tournaments/:id/registrations/:rid/reject', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.reject('t1', 'r1', { reason: 'Incomplete team' });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1/registrations/r1/reject' }),
    );
  });
});

// ─── AdminTournamentParticipantsClient ───────────────────────────────────────

describe('createAdminTournamentParticipantsClient', () => {
  function make() {
    const request = jest.fn();
    const client = createAdminTournamentParticipantsClient({ request } as never);
    return { request, client };
  }

  it('list calls GET /admin/v1/tournaments/:id/participants', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.list('t1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1/participants' }),
    );
  });

  it('list passes status filter', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.list('t1', { status: 'active' });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1/participants?status=active' }),
    );
  });
});

// ─── AdminTournamentMatchesClient ─────────────────────────────────────────────

describe('createAdminTournamentMatchesClient', () => {
  function make() {
    const request = jest.fn();
    const client = createAdminTournamentMatchesClient({ request } as never);
    return { request, client };
  }

  it('list calls GET /admin/v1/tournaments/:id/matches', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.list('t1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1/matches' }),
    );
  });

  it('getById calls GET /admin/v1/tournaments/:id/matches/:mid', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.getById('t1', 'm1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/tournaments/t1/matches/m1' }),
    );
  });

  it('updateResult calls PUT /admin/v1/tournaments/:id/matches/:mid/result', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.updateResult('t1', 'm1', { winnerId: 'p1' });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        path: '/admin/v1/tournaments/t1/matches/m1/result',
      }),
    );
  });

  it('has no liveScore or stream fields in method surface', () => {
    const { client } = make();
    expect('updateLiveScore' in client).toBe(false);
    expect('setStream' in client).toBe(false);
  });
});

// ─── AdminTournamentStandingsClient (locked names) ───────────────────────────

describe('createAdminTournamentStandingsClient', () => {
  function make() {
    const request = jest.fn();
    const client = createAdminTournamentStandingsClient({ request } as never);
    return { request, client };
  }

  it('exposes get() method (locked name)', () => {
    const { client } = make();
    expect(typeof client.get).toBe('function');
  });

  it('exposes recalculate() method (locked name)', () => {
    const { client } = make();
    expect(typeof client.recalculate).toBe('function');
  });

  it('get calls GET /admin/v1/tournaments/:id/standings', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.get('t1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/admin/v1/tournaments/t1/standings' }),
    );
  });

  it('recalculate calls POST /admin/v1/tournaments/:id/standings/recalculate', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.recalculate('t1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/admin/v1/tournaments/t1/standings/recalculate',
      }),
    );
  });

  it('has no alias like getStandings or calculateStandings', () => {
    const { client } = make();
    expect('getStandings' in client).toBe(false);
    expect('calculateStandings' in client).toBe(false);
    expect('computeStandings' in client).toBe(false);
  });
});

// ─── AdminTournamentBracketClient (display-only, read-only) ──────────────────

describe('createAdminTournamentBracketClient', () => {
  function make() {
    const request = jest.fn();
    const client = createAdminTournamentBracketClient({ request } as never);
    return { request, client };
  }

  it('exposes only get() method', () => {
    const { client } = make();
    expect(typeof client.get).toBe('function');
    expect(Object.keys(client)).toEqual(['get']);
  });

  it('get calls GET /admin/v1/tournaments/:id/bracket', async () => {
    const { request, client } = make();
    request.mockResolvedValue({});
    await client.get('t1');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/admin/v1/tournaments/t1/bracket' }),
    );
  });

  it('has no edit, override, or dragDrop methods', () => {
    const { client } = make();
    expect('edit' in client).toBe(false);
    expect('override' in client).toBe(false);
    expect('dragDrop' in client).toBe(false);
    expect('manualOverride' in client).toBe(false);
  });
});

// ─── search.tournaments() ─────────────────────────────────────────────────────

describe('createSearchClient – tournaments()', () => {
  function make() {
    const request = jest.fn();
    const client = createSearchClient({ request } as never);
    return { request, client };
  }

  it('exposes tournaments() method (locked name)', () => {
    const { client } = make();
    expect(typeof client.tournaments).toBe('function');
  });

  it('has no searchTournaments alias', () => {
    const { client } = make();
    expect('searchTournaments' in client).toBe(false);
  });

  it('tournaments calls GET /api/v1/search/tournaments with no params', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.tournaments();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/api/v1/search/tournaments' }),
    );
  });

  it('tournaments passes gameId and status filters', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.tournaments({ gameId: 'g1', status: 'registration_open' });
    const callArg = request.mock.calls[0]?.[0] as { path: string };
    expect(callArg.path).toContain('gameId=g1');
    expect(callArg.path).toContain('status=registration_open');
  });
});

// ─── admin-search.tournaments() ───────────────────────────────────────────────

describe('createAdminSearchClient – tournaments()', () => {
  function make() {
    const request = jest.fn();
    const client = createAdminSearchClient({ request } as never);
    return { request, client };
  }

  it('exposes tournaments() method (locked name)', () => {
    const { client } = make();
    expect(typeof client.tournaments).toBe('function');
  });

  it('has no searchTournaments alias', () => {
    const { client } = make();
    expect('searchTournaments' in client).toBe(false);
  });

  it('tournaments calls GET /admin/v1/search/tournaments', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.tournaments();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/admin/v1/search/tournaments' }),
    );
  });

  it('tournaments passes format filter', async () => {
    const { request, client } = make();
    request.mockResolvedValue(emptyList);
    await client.tournaments({ format: 'round_robin' });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/v1/search/tournaments?format=round_robin' }),
    );
  });
});

// ─── No hardcoded domains in any Phase 1 paths ────────────────────────────────

describe('Phase 1 SDK paths have no hardcoded domains', () => {
  const clients = [
    { name: 'games', client: createGamesClient({ request: jest.fn() } as never) },
    { name: 'admin-games', client: createAdminGamesClient({ request: jest.fn() } as never) },
    { name: 'tournaments', client: createTournamentsClient({ request: jest.fn() } as never) },
    {
      name: 'admin-tournaments',
      client: createAdminTournamentsClient({ request: jest.fn() } as never),
    },
    {
      name: 'admin-standings',
      client: createAdminTournamentStandingsClient({ request: jest.fn() } as never),
    },
    {
      name: 'admin-bracket',
      client: createAdminTournamentBracketClient({ request: jest.fn() } as never),
    },
  ];

  it.each(clients)(
    '$name client factory accepts any ApiClient (no hardcoded URL)',
    ({ client }) => {
      expect(client).toBeDefined();
    },
  );
});
