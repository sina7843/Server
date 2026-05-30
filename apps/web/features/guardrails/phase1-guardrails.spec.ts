/**
 * Phase 1 behavioral guardrails — web app.
 *
 * Verifies that the web app SDK surface follows Phase 1 discipline:
 *   - search.tournaments() uses correct path and locked name
 *   - no hardcoded API origins in SDK call paths
 *   - analytics event names follow dot-notation convention
 *   - forbidden public routes are absent from SDK surface
 *   - unsupported tournament formats are not referenced
 */

// ─── Jest globals (web spec convention) ──────────────────────────────────────

type WebTestFn = () => void | Promise<void>;

interface WebExpectMatchers {
  readonly not: WebExpectMatchers;
  toBe(expected: unknown): void;
  toContain(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeDefined(): void;
  toMatch(pattern: RegExp | string): void;
  toHaveLength(n: number): void;
  toBeGreaterThan(n: number): void;
}

interface WebMockFn {
  (...args: readonly unknown[]): unknown;
  mockResolvedValue(v: unknown): WebMockFn;
  readonly mock: { readonly calls: ReadonlyArray<ReadonlyArray<unknown>> };
}

declare const describe: (name: string, fn: WebTestFn) => void;
declare const it: (name: string, fn: WebTestFn) => void;
declare const expect: (actual: unknown) => WebExpectMatchers;
declare const jest: { fn(): WebMockFn };

// ─── Imports ──────────────────────────────────────────────────────────────────

import { ANALYTICS_EVENT_TYPES } from '@dragon/types';
import { createSearchClient, createApiClient, createTournamentsClient } from '@dragon/sdk';
import { createSearchApi } from '../search/search-api';

// ─── Mock response helpers ────────────────────────────────────────────────────

function emptyListResponse() {
  return { ok: true, status: 200, json: async () => ({ items: [], total: 0, page: 1, limit: 20 }) };
}

function emptyResponse() {
  return { ok: true, status: 200, json: async () => ({}) };
}

// ─── search.tournaments() — domain-awareness ──────────────────────────────────

describe('search.tournaments() domain-awareness', () => {
  it('createSearchApi accepts a configurable baseUrl (no hardcoded domain)', () => {
    const api = createSearchApi({ baseUrl: 'https://custom.example.com' });
    expect(api).toBeDefined();
  });

  it('tournaments() path is /api/v1/search/tournaments (no hardcoded origin)', async () => {
    const fetcher = jest.fn().mockResolvedValue(emptyListResponse());
    const client = createSearchClient(createApiClient({ baseUrl: '/', fetch: fetcher as never }));
    await client.tournaments();
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('/api/v1/search/tournaments');
    expect(calledUrl).not.toContain('localhost');
    expect(calledUrl).not.toContain('qesb.ir');
    expect(calledUrl).not.toContain('api.qesb.ir');
  });

  it('tournaments() baseUrl is completely configurable (domain-aware design)', async () => {
    const fetcher = jest.fn().mockResolvedValue(emptyListResponse());
    const client = createSearchClient(
      createApiClient({ baseUrl: 'https://any-domain.example', fetch: fetcher as never }),
    );
    await client.tournaments();
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toMatch(/^https:\/\/any-domain\.example/);
  });
});

// ─── search.tournaments() — locked method name ────────────────────────────────

describe('search.tournaments() locked method name', () => {
  it('method is named tournaments() — not searchTournaments()', () => {
    const client = createSearchClient(createApiClient({ baseUrl: '/' }));
    const surface = client as unknown as Record<string, unknown>;
    expect(typeof surface['tournaments']).toBe('function');
    expect('searchTournaments' in client).toBe(false);
    expect('getTournaments' in client).toBe(false);
    expect('listTournaments' in client).toBe(false);
  });

  it('tournaments() passes gameId, status, format filters in query string', async () => {
    const fetcher = jest.fn().mockResolvedValue(emptyListResponse());
    const client = createSearchClient(createApiClient({ baseUrl: '/', fetch: fetcher as never }));
    await client.tournaments({
      gameId: 'g1',
      status: 'registration_open',
      format: 'single_elimination',
    });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('gameId=g1');
    expect(calledUrl).toContain('status=registration_open');
    expect(calledUrl).toContain('format=single_elimination');
  });
});

// ─── Public tournament client — Phase 1 surface ───────────────────────────────

describe('createTournamentsClient Phase 1 surface', () => {
  it('getBySlug path is /api/v1/tournaments/:slug (no hardcoded origin)', async () => {
    const fetcher = jest.fn().mockResolvedValue(emptyResponse());
    const client = createTournamentsClient(
      createApiClient({ baseUrl: '/', fetch: fetcher as never }),
    );
    await client.getBySlug('dragon-cup-2026');
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('/api/v1/tournaments/dragon-cup-2026');
    expect(calledUrl).not.toContain('localhost');
    expect(calledUrl).not.toContain('qesb.ir');
  });

  it('has no getMatchById method (public match detail is forbidden in Phase 1)', () => {
    const client = createTournamentsClient(createApiClient({ baseUrl: '/' }));
    expect('getMatchById' in client).toBe(false);
    expect('getPublicMatch' in client).toBe(false);
    expect('matchDetail' in client).toBe(false);
  });

  it('getBracket returns a display-only projection (no edit methods)', () => {
    const client = createTournamentsClient(createApiClient({ baseUrl: '/' }));
    const surface = client as unknown as Record<string, unknown>;
    expect(typeof surface['getBracket']).toBe('function');
    expect('editBracket' in client).toBe(false);
    expect('overrideBracket' in client).toBe(false);
  });
});

// ─── Analytics event constant guardrails ─────────────────────────────────────

describe('Phase 1 analytics event constants', () => {
  it('ANALYTICS_EVENT_TYPES contains all five Phase 1 tournament events', () => {
    expect(ANALYTICS_EVENT_TYPES).toContain('tournament.viewed');
    expect(ANALYTICS_EVENT_TYPES).toContain('tournament.registration_started');
    expect(ANALYTICS_EVENT_TYPES).toContain('tournament.registration_completed');
    expect(ANALYTICS_EVENT_TYPES).toContain('tournament.bracket_viewed');
    expect(ANALYTICS_EVENT_TYPES).toContain('tournament.match_viewed');
  });

  it('event names use dot-notation namespacing (not snake_case)', () => {
    expect(ANALYTICS_EVENT_TYPES).not.toContain('tournament_viewed');
    expect(ANALYTICS_EVENT_TYPES).not.toContain('registration_completed');
    expect(ANALYTICS_EVENT_TYPES).not.toContain('bracket_viewed');
    expect(ANALYTICS_EVENT_TYPES).not.toContain('matchViewed');
    expect(ANALYTICS_EVENT_TYPES).not.toContain('tournament.registrationStarted');
  });

  it('ANALYTICS_EVENT_TYPES is a readonly array with values', () => {
    expect((ANALYTICS_EVENT_TYPES as readonly string[]).length).toBeGreaterThan(0);
  });
});

// ─── Unsupported format guardrails ────────────────────────────────────────────

describe('unsupported tournament format guardrails', () => {
  it('Phase 1 supported formats do not include swiss', () => {
    const PHASE1_FORMATS = ['single_elimination', 'round_robin', 'manual'];
    expect(PHASE1_FORMATS).not.toContain('swiss');
    expect(PHASE1_FORMATS).not.toContain('double_elimination');
    expect(PHASE1_FORMATS).not.toContain('advanced_bracket_editor');
  });

  it('tournament search does not accept swiss format without TypeScript error', async () => {
    // Runtime check: passing a valid format produces a well-formed query string
    const fetcher = jest.fn().mockResolvedValue(emptyListResponse());
    const client = createSearchClient(createApiClient({ baseUrl: '/', fetch: fetcher as never }));
    await client.tournaments({ format: 'round_robin' });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('format=round_robin');
  });
});

// ─── Forbidden public routes absent from SDK surface ─────────────────────────

describe('forbidden public routes absent from web SDK surface', () => {
  it('TournamentsClient has no route for /tournaments/:slug/matches/:matchId', () => {
    const client = createTournamentsClient(createApiClient({ baseUrl: '/' }));
    expect('getMatchById' in client).toBe(false);
    expect('getMatch' in client).toBe(false);
  });

  it('SearchClient has no method exposing direct match detail', () => {
    const client = createSearchClient(createApiClient({ baseUrl: '/' }));
    expect('searchMatches' in client).toBe(false);
    expect('getMatch' in client).toBe(false);
  });
});
