import { processSmsJob } from './sms-processor';

function createMockJob(name: string, data: Record<string, unknown> = {}, attemptsMade = 0) {
  return { name, data, attemptsMade } as never;
}

describe('processSmsJob', () => {
  it('updates JobLog to processing at start', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('sms.send', { jobLogId: 'log-1' });

    await processSmsJob(job, updateStatus);

    expect(updateStatus).toHaveBeenCalledWith(
      'log-1',
      'processing',
      expect.objectContaining({ attempts: 1, startedAt: expect.any(Date) }),
    );
  });

  it('updates JobLog to completed on success', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('sms.send', { jobLogId: 'log-1' });

    await processSmsJob(job, updateStatus);

    expect(updateStatus).toHaveBeenCalledWith(
      'log-1',
      'completed',
      expect.objectContaining({ attempts: 1, completedAt: expect.any(Date) }),
    );
  });

  it('updates JobLog to failed and re-throws on unknown job name', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('sms.unknown', { jobLogId: 'log-1' });

    await expect(processSmsJob(job, updateStatus)).rejects.toThrow('Unknown SMS job: sms.unknown');

    expect(updateStatus).toHaveBeenCalledWith(
      'log-1',
      'failed',
      expect.objectContaining({ error: expect.stringContaining('Unknown SMS job') }),
    );
  });

  it('increments attempts from job.attemptsMade', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('sms.send', { jobLogId: 'log-1' }, 2);

    await processSmsJob(job, updateStatus);

    const processingCall = updateStatus.mock.calls.find((c) => c[1] === 'processing');
    expect(processingCall?.[2]).toMatchObject({ attempts: 3 });
  });

  it('does not call updateStatus when jobLogId is absent', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('sms.send', {});

    await processSmsJob(job, updateStatus);

    expect(updateStatus).not.toHaveBeenCalled();
  });

  it('does not store any raw OTP or token in status updates', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const job = createMockJob('sms.send', { jobLogId: 'log-1', otp: '123456' });

    await processSmsJob(job, updateStatus);

    for (const call of updateStatus.mock.calls) {
      const serialized = JSON.stringify(call);
      expect(serialized).not.toContain('123456');
    }
  });
});
