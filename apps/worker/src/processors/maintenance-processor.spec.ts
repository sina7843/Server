import { processMaintenanceJob } from './maintenance-processor';

function createMockJob(name: string, data: Record<string, unknown> = {}, attemptsMade = 0) {
  return { name, data, attemptsMade } as never;
}

describe('processMaintenanceJob', () => {
  it('updates JobLog to processing at start', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('maintenance.cleanup_expired_sessions', { jobLogId: 'log-1' });

    await processMaintenanceJob(job, updateStatus);

    expect(updateStatus).toHaveBeenCalledWith(
      'log-1',
      'processing',
      expect.objectContaining({ attempts: 1, startedAt: expect.any(Date) }),
    );
  });

  it('updates JobLog to completed on success', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('maintenance.cleanup_expired_sessions', { jobLogId: 'log-1' });

    await processMaintenanceJob(job, updateStatus);

    expect(updateStatus).toHaveBeenCalledWith(
      'log-1',
      'completed',
      expect.objectContaining({ attempts: 1, completedAt: expect.any(Date) }),
    );
  });

  it('handles cleanup_expired_otps job', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('maintenance.cleanup_expired_otps', { jobLogId: 'log-1' });

    await processMaintenanceJob(job, updateStatus);

    expect(updateStatus).toHaveBeenCalledWith('log-1', 'completed', expect.any(Object));
  });

  it('handles cleanup_unverified_users job', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('maintenance.cleanup_unverified_users', { jobLogId: 'log-1' });

    await processMaintenanceJob(job, updateStatus);

    expect(updateStatus).toHaveBeenCalledWith('log-1', 'completed', expect.any(Object));
  });

  it('updates JobLog to failed and re-throws on unknown job name', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('maintenance.backup_everything', { jobLogId: 'log-1' });

    await expect(processMaintenanceJob(job, updateStatus)).rejects.toThrow(
      'Unknown maintenance job: maintenance.backup_everything',
    );

    expect(updateStatus).toHaveBeenCalledWith(
      'log-1',
      'failed',
      expect.objectContaining({ error: expect.stringContaining('Unknown maintenance job') }),
    );
  });

  it('does not implement backup jobs', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('maintenance.backup_database', { jobLogId: 'log-1' });

    await expect(processMaintenanceJob(job, updateStatus)).rejects.toThrow();
  });
});
