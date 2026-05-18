import { formatRbacSeedSummary, runRbacSeedCommand } from './run-rbac-seed';

const seedResult = {
  permissionsCreated: 1,
  permissionsUpdated: 2,
  rolesCreated: 3,
  rolesUpdated: 4,
  rolePermissionsAttached: 5,
  superAdminAssignmentCreated: 1,
  skipped: ['super-admin-bootstrap:not-configured'],
};

describe('runRbacSeedCommand', () => {
  it('delegates to RbacSeedService and prints a safe summary only', async () => {
    const logger = { log: jest.fn(), error: jest.fn() };
    const seedService = {
      runRbacSeed: jest.fn().mockResolvedValue(seedResult),
    };

    await expect(runRbacSeedCommand(seedService, logger)).resolves.toBe(0);

    expect(seedService.runRbacSeed).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith(JSON.stringify(seedResult, null, 2));
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.log.mock.calls[0]?.[0]).not.toContain('+98');
  });

  it('returns non-zero and does not print thrown error details on failure', async () => {
    const logger = { log: jest.fn(), error: jest.fn() };
    const seedService = {
      runRbacSeed: jest.fn().mockRejectedValue(new Error('secret +989121234567')),
    };

    await expect(runRbacSeedCommand(seedService, logger)).resolves.toBe(1);

    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('RBAC seed failed.');
  });

  it('formats only seed result counters and skipped values', () => {
    expect(formatRbacSeedSummary(seedResult)).toEqual(seedResult);
  });
});
