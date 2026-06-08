import {
  DEFAULT_DEV_SEED_PASSWORD,
  DEV_SEED_GAME_SLUGS,
  DEV_SEED_TOURNAMENT_SLUGS,
  DEV_TEST_ACCOUNTS,
} from './phase1-dev-seed.constants';

describe('Phase 1 dev seed constants', () => {
  it('declares deterministic required local accounts without duplicate emails or phones', () => {
    expect(DEV_TEST_ACCOUNTS).toHaveLength(11);
    expect(new Set(DEV_TEST_ACCOUNTS.map((account) => account.email)).size).toBe(
      DEV_TEST_ACCOUNTS.length,
    );
    expect(new Set(DEV_TEST_ACCOUNTS.map((account) => account.phone)).size).toBe(
      DEV_TEST_ACCOUNTS.length,
    );
  });

  it('includes the requested test emails', () => {
    expect(DEV_TEST_ACCOUNTS.map((account) => account.email)).toEqual(
      expect.arrayContaining([
        'superadmin@dragon.local',
        'admin@dragon.local',
        'organizer@dragon.local',
        'editor@dragon.local',
        'player1@dragon.local',
        'player2@dragon.local',
        'player3@dragon.local',
        'player4@dragon.local',
        'player5@dragon.local',
        'player6@dragon.local',
      ]),
    );
  });

  it('uses a strong deterministic default password for local only', () => {
    expect(DEFAULT_DEV_SEED_PASSWORD).toBe('DragonTest@12345');
  });

  it('uses only Phase 1 supported seeded tournament formats by fixture naming', () => {
    expect(DEV_SEED_TOURNAMENT_SLUGS).not.toContain('swiss');
    expect(DEV_SEED_TOURNAMENT_SLUGS).not.toContain('double_elimination');
  });

  it('has enough games and tournaments for filters and pagination', () => {
    expect(DEV_SEED_GAME_SLUGS.length).toBeGreaterThanOrEqual(6);
    expect(DEV_SEED_TOURNAMENT_SLUGS.length).toBeGreaterThanOrEqual(10);
  });
});
