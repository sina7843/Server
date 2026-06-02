/**
 * Task 7.3 guardrails — Public results projection.
 *
 * Permanent guardrails (never remove):
 *   - public results is list-only (no detail route)
 *   - no public result mutation route
 *   - no public match detail route
 *   - no live result feed / WebSocket
 *   - no admin/internal fields in public response
 *   - no fake results
 *   - no hardcoded localhost or qesb.ir
 */

import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';

const MATCH_DIR = join(__dirname);

function read(file: string): string {
  return readFileSync(join(MATCH_DIR, file), 'utf8');
}

// ─── Required file exists ─────────────────────────────────────────────────────

describe('required public results file exists', () => {
  it('public-tournament-results.controller.ts exists', () => {
    expect(existsSync(join(MATCH_DIR, 'public-tournament-results.controller.ts'))).toBe(true);
  });
});

// ─── PERMANENT: List-only — no result detail or mutation ─────────────────────

describe('PERMANENT — public results is list-only projection', () => {
  it('controller has no :resultId or :matchId detail route', () => {
    const src = read('public-tournament-results.controller.ts');
    expect(src).not.toMatch(/:resultId/);
    expect(src).not.toMatch(/matches\/:matchId/);
  });

  it('controller has no POST, PATCH, DELETE endpoints', () => {
    const src = read('public-tournament-results.controller.ts');
    expect(src).not.toMatch(/@Post\(|@Patch\(|@Delete\(/);
  });

  it('controller does not define any mutation route', () => {
    const src = read('public-tournament-results.controller.ts');
    expect(src).not.toMatch(/result\/void/);
  });
});

// ─── PERMANENT: No live result feed ───────────────────────────────────────────

describe('PERMANENT — no live result feed', () => {
  it('controller has no WebSocket or live score references', () => {
    const src = read('public-tournament-results.controller.ts');
    expect(src).not.toMatch(/WebSocket|Socket\.io|liveScore|scoreEvent|@WebSocketGateway/);
  });
});

// ─── PERMANENT: No admin/internal fields ──────────────────────────────────────

describe('PERMANENT — no admin/internal fields in public results', () => {
  it('controller uses toResultDto projection (not raw document)', () => {
    const src = read('public-tournament-results.controller.ts');
    expect(src).toContain('toResultDto');
  });

  it('controller does not expose notes or admin fields', () => {
    const src = read('public-tournament-results.controller.ts');
    expect(src).not.toMatch(/resultNotes|adminNotes/);
  });
});

// ─── PERMANENT: No fake results ───────────────────────────────────────────────

describe('PERMANENT — no fake results in public controller', () => {
  it('controller has no fake data', () => {
    const src = read('public-tournament-results.controller.ts');
    expect(src).not.toMatch(/fake|FAKE|Dragon Cup/);
    expect(src).not.toMatch(/\bseedData\b|\bSEED_DATA\b/);
  });
});

// ─── PERMANENT: No hardcoded origins ─────────────────────────────────────────

describe('PERMANENT — no hardcoded localhost or qesb.ir in public results', () => {
  it('public-tournament-results.controller.ts has no hardcoded origins', () => {
    const src = read('public-tournament-results.controller.ts');
    expect(src).not.toMatch(/localhost/);
    expect(src).not.toMatch(/qesb\.ir/);
  });
});
