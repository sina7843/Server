import { Types } from 'mongoose';
import {
  generateSingleEliminationRound1,
  generateRoundRobin,
  isPowerOfTwo,
} from './tournament-match-generation';

function makeIds(n: number): Types.ObjectId[] {
  return Array.from({ length: n }, () => new Types.ObjectId());
}

// ─── Single elimination ───────────────────────────────────────────────────────

describe('generateSingleEliminationRound1', () => {
  it('generates correct number of matches for even participant count', () => {
    const ids = makeIds(8);
    const matches = generateSingleEliminationRound1(ids);
    expect(matches).toHaveLength(4);
  });

  it('all matches are in round 1', () => {
    const matches = generateSingleEliminationRound1(makeIds(4));
    for (const m of matches) expect(m.round).toBe(1);
  });

  it('assigns sequential matchNumbers starting at 1', () => {
    const matches = generateSingleEliminationRound1(makeIds(4));
    expect(matches.map((m) => m.matchNumber)).toEqual([1, 2]);
  });

  it('pairs participants in order (1v2, 3v4, etc.)', () => {
    const ids = makeIds(4);
    const matches = generateSingleEliminationRound1(ids);
    expect(String(matches[0]!.participant1Id)).toBe(String(ids[0]));
    expect(String(matches[0]!.participant2Id)).toBe(String(ids[1]));
    expect(String(matches[1]!.participant1Id)).toBe(String(ids[2]));
    expect(String(matches[1]!.participant2Id)).toBe(String(ids[3]));
  });

  it('handles 2 participants', () => {
    const ids = makeIds(2);
    const matches = generateSingleEliminationRound1(ids);
    expect(matches).toHaveLength(1);
  });

  it('returns empty array for 0 participants', () => {
    expect(generateSingleEliminationRound1([])).toHaveLength(0);
  });
});

// ─── isPowerOfTwo ─────────────────────────────────────────────────────────────

describe('isPowerOfTwo', () => {
  it.each([2, 4, 8, 16, 32])('returns true for power-of-two: %i', (n) => {
    expect(isPowerOfTwo(n)).toBe(true);
  });

  it.each([0, 1, 3, 5, 6, 7, 9, 10, 15])('returns false for non-power-of-two: %i', (n) => {
    expect(isPowerOfTwo(n)).toBe(false);
  });
});

// ─── Round robin ─────────────────────────────────────────────────────────────

describe('generateRoundRobin', () => {
  it('generates correct total matches for 4 participants (3 rounds × 2 matches)', () => {
    const matches = generateRoundRobin(makeIds(4));
    expect(matches).toHaveLength(6);
  });

  it('generates N-1 rounds for even N', () => {
    const matches = generateRoundRobin(makeIds(4));
    const rounds = new Set(matches.map((m) => m.round));
    expect(rounds.size).toBe(3);
  });

  it('generates N rounds for odd N (bye matches excluded)', () => {
    const matches = generateRoundRobin(makeIds(3));
    const rounds = new Set(matches.map((m) => m.round));
    expect(rounds.size).toBe(3);
  });

  it('every participant appears exactly N-1 times total (even N=4)', () => {
    const ids = makeIds(4);
    const matches = generateRoundRobin(ids);
    for (const id of ids) {
      const count = matches.filter(
        (m) => String(m.participant1Id) === String(id) || String(m.participant2Id) === String(id),
      ).length;
      expect(count).toBe(3);
    }
  });

  it('no participant faces itself in any match', () => {
    const matches = generateRoundRobin(makeIds(6));
    for (const m of matches) {
      if (m.participant1Id && m.participant2Id) {
        expect(String(m.participant1Id)).not.toBe(String(m.participant2Id));
      }
    }
  });

  it('no bye slots (null participants) appear in output', () => {
    const matches = generateRoundRobin(makeIds(5));
    for (const m of matches) {
      expect(m.participant1Id).toBeDefined();
      expect(m.participant2Id).toBeDefined();
    }
  });

  it('returns empty array for fewer than 2 participants', () => {
    expect(generateRoundRobin([])).toHaveLength(0);
    expect(generateRoundRobin(makeIds(1))).toHaveLength(0);
  });

  it('handles 2 participants (1 match)', () => {
    const matches = generateRoundRobin(makeIds(2));
    expect(matches).toHaveLength(1);
  });

  it('each match has unique (round, matchNumber) pair', () => {
    const matches = generateRoundRobin(makeIds(6));
    const keys = matches.map((m) => `${m.round}-${m.matchNumber}`);
    expect(new Set(keys).size).toBe(matches.length);
  });
});
