import { runPhase1DevSeedCommand } from './run-phase1-dev-seed';
import { runPhase1DevSeedResetCommand } from './run-phase1-dev-seed-reset';
import { PHASE1_DEV_SEED_PASSWORD } from './phase1-dev-seed.constants';

const mockSeedResult = {
  usersCreated: 8,
  usersUpdated: 0,
  profilesCreated: 8,
  profilesUpdated: 0,
  userRolesAttached: 8,
  gamesCreated: 4,
  gamesUpdated: 0,
  tournamentsCreated: 7,
  tournamentsUpdated: 0,
  registrationsCreated: 13,
  registrationsUpdated: 0,
  matchesCreated: 4,
  matchesUpdated: 0,
  notificationLogsCreated: 4,
  notificationLogsUpdated: 0,
  skipped: [],
};

const mockResetResult = {
  usersDeleted: 8,
  profilesDeleted: 8,
  userRolesDeleted: 8,
  gamesDeleted: 4,
  tournamentsDeleted: 7,
  registrationsDeleted: 13,
  matchesDeleted: 4,
  notificationLogsDeleted: 4,
};

describe('phase1 dev seed commands', () => {
  it('prints deterministic account credentials after successful seed (non-CI)', async () => {
    const log = jest.fn();
    // Pass explicit non-CI env so CI environment of the test runner does not affect output.
    // Omit CI key entirely (exactOptionalPropertyTypes=true disallows { CI: undefined }).
    const code = await runPhase1DevSeedCommand(
      { runSeed: jest.fn().mockResolvedValue(mockSeedResult) },
      { log, error: jest.fn() },
      {},
    );

    expect(code).toBe(0);
    expect(log).toHaveBeenCalledWith('Development seed completed.');
    expect(log).toHaveBeenCalledWith('   Email: superadmin@dragon.local');
    expect(log).toHaveBeenCalledWith('   Phone: +15550001001');
    expect(log).toHaveBeenCalledWith(`   Password: ${PHASE1_DEV_SEED_PASSWORD}`);
  });

  it('uses env-overridden password when DRAGON_DEV_SEED_PASSWORD is set', async () => {
    const log = jest.fn();
    const code = await runPhase1DevSeedCommand(
      { runSeed: jest.fn().mockResolvedValue(mockSeedResult) },
      { log, error: jest.fn() },
      { DRAGON_DEV_SEED_PASSWORD: 'CustomPass@9999' },
    );

    expect(code).toBe(0);
    expect(log).toHaveBeenCalledWith('   Password: CustomPass@9999');
    // Default password must NOT appear when override is active.
    const allCalls = log.mock.calls.map((c) => c[0] as string);
    expect(allCalls.some((msg) => msg.includes(PHASE1_DEV_SEED_PASSWORD))).toBe(false);
  });

  it('suppresses credentials in CI by default', async () => {
    const log = jest.fn();
    const code = await runPhase1DevSeedCommand(
      { runSeed: jest.fn().mockResolvedValue(mockSeedResult) },
      { log, error: jest.fn() },
      { CI: 'true' },
    );

    expect(code).toBe(0);
    const allCalls = log.mock.calls.map((c) => c[0] as string);
    // No Password: line should appear.
    expect(allCalls.some((msg) => msg.startsWith('   Password:'))).toBe(false);
    // Should print a suppression notice.
    expect(allCalls.some((msg) => msg.includes('suppressed in CI'))).toBe(true);
  });

  it('prints credentials in CI when DRAGON_PRINT_SEED_CREDENTIALS=true', async () => {
    const log = jest.fn();
    const code = await runPhase1DevSeedCommand(
      { runSeed: jest.fn().mockResolvedValue(mockSeedResult) },
      { log, error: jest.fn() },
      { CI: 'true', DRAGON_PRINT_SEED_CREDENTIALS: 'true' },
    );

    expect(code).toBe(0);
    expect(log).toHaveBeenCalledWith(`   Password: ${PHASE1_DEV_SEED_PASSWORD}`);
  });

  it('returns exit code 1 and logs error on seed failure', async () => {
    const log = jest.fn();
    const error = jest.fn();
    const code = await runPhase1DevSeedCommand(
      { runSeed: jest.fn().mockRejectedValue(new Error('Seed failed badly.')) },
      { log, error },
      {},
    );

    expect(code).toBe(1);
    expect(error).toHaveBeenCalledWith('Seed failed badly.');
  });

  it('prints reset counts after successful reset', async () => {
    const log = jest.fn();
    const code = await runPhase1DevSeedResetCommand(
      { resetSeed: jest.fn().mockResolvedValue(mockResetResult) },
      { log, error: jest.fn() },
    );

    expect(code).toBe(0);
    expect(log).toHaveBeenCalledWith('Seed reset completed.');
    expect(log).toHaveBeenCalledWith('- users: 8');
    expect(log).toHaveBeenCalledWith('- tournaments: 7');
  });
});
