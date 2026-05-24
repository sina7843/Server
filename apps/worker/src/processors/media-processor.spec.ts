import { processMediaJob } from './media-processor';

function createMockJob(name: string, data: Record<string, unknown> = {}, attemptsMade = 0) {
  return { name, data, attemptsMade } as never;
}

describe('processMediaJob', () => {
  it('updates JobLog to processing at start', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('media.generate_variants', { jobLogId: 'log-1', assetId: 'abc' });

    await processMediaJob(job, updateStatus);

    expect(updateStatus).toHaveBeenCalledWith(
      'log-1',
      'processing',
      expect.objectContaining({ attempts: 1, startedAt: expect.any(Date) }),
    );
  });

  it('updates JobLog to completed on success', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('media.generate_variants', { jobLogId: 'log-1' });

    await processMediaJob(job, updateStatus);

    expect(updateStatus).toHaveBeenCalledWith(
      'log-1',
      'completed',
      expect.objectContaining({ attempts: 1, completedAt: expect.any(Date) }),
    );
  });

  it('handles media.regenerate_variants job', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('media.regenerate_variants', { jobLogId: 'log-1' });

    await processMediaJob(job, updateStatus);

    expect(updateStatus).toHaveBeenCalledWith('log-1', 'completed', expect.any(Object));
  });

  it('updates JobLog to failed and re-throws on unknown job name', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('media.unknown', { jobLogId: 'log-1' });

    await expect(processMediaJob(job, updateStatus)).rejects.toThrow(
      'Unknown media job: media.unknown',
    );

    expect(updateStatus).toHaveBeenCalledWith(
      'log-1',
      'failed',
      expect.objectContaining({ error: expect.stringContaining('Unknown media job') }),
    );
  });

  it('does not call updateStatus when jobLogId is absent', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('media.generate_variants', {});

    await processMediaJob(job, updateStatus);

    expect(updateStatus).not.toHaveBeenCalled();
  });
});
