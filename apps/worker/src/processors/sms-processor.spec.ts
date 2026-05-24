import { processSmsJob } from './sms-processor';
import type { NotificationLogStatusUpdater } from './processor-types';

function createMockJob(name: string, data: Record<string, unknown> = {}, attemptsMade = 0) {
  return { name, data, attemptsMade } as never;
}

function createUpdateNotificationLog(): jest.MockedFunction<NotificationLogStatusUpdater> {
  return jest.fn().mockResolvedValue(undefined);
}

describe('processSmsJob', () => {
  it('updates JobLog to processing at start', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const updateNotificationLog = createUpdateNotificationLog();
    const job = createMockJob('sms.send', { jobLogId: 'log-1' });

    await processSmsJob(job, updateStatus, updateNotificationLog);

    expect(updateStatus).toHaveBeenCalledWith(
      'log-1',
      'processing',
      expect.objectContaining({ attempts: 1, startedAt: expect.any(Date) }),
    );
  });

  it('updates JobLog to completed on success', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const updateNotificationLog = createUpdateNotificationLog();
    const job = createMockJob('sms.send', { jobLogId: 'log-1' });

    await processSmsJob(job, updateStatus, updateNotificationLog);

    expect(updateStatus).toHaveBeenCalledWith(
      'log-1',
      'completed',
      expect.objectContaining({ attempts: 1, completedAt: expect.any(Date) }),
    );
  });

  it('updates JobLog to failed and re-throws on unknown job name', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const updateNotificationLog = createUpdateNotificationLog();
    const job = createMockJob('sms.unknown', { jobLogId: 'log-1' });

    await expect(processSmsJob(job, updateStatus, updateNotificationLog)).rejects.toThrow(
      'Unknown SMS job: sms.unknown',
    );

    expect(updateStatus).toHaveBeenCalledWith(
      'log-1',
      'failed',
      expect.objectContaining({ error: expect.stringContaining('Unknown SMS job') }),
    );
  });

  it('increments attempts from job.attemptsMade', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const updateNotificationLog = createUpdateNotificationLog();
    const job = createMockJob('sms.send', { jobLogId: 'log-1' }, 2);

    await processSmsJob(job, updateStatus, updateNotificationLog);

    const processingCall = updateStatus.mock.calls.find((c) => c[1] === 'processing');
    expect(processingCall?.[2]).toMatchObject({ attempts: 3 });
  });

  it('does not call updateStatus when jobLogId is absent', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const updateNotificationLog = createUpdateNotificationLog();
    const job = createMockJob('sms.send', {});

    await processSmsJob(job, updateStatus, updateNotificationLog);

    expect(updateStatus).not.toHaveBeenCalled();
  });

  it('does not store any raw OTP or token in status updates', async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const updateNotificationLog = createUpdateNotificationLog();
    const job = createMockJob('sms.send', { jobLogId: 'log-1', otp: '123456' });

    await processSmsJob(job, updateStatus, updateNotificationLog);

    for (const call of updateStatus.mock.calls) {
      const serialized = JSON.stringify(call);
      expect(serialized).not.toContain('123456');
    }
  });

  describe('sms.send', () => {
    it('marks NotificationLog as sent on provider success', async () => {
      const updateStatus = jest.fn().mockResolvedValue(undefined);
      const updateNotificationLog = createUpdateNotificationLog();
      const job = createMockJob('sms.send', {
        notificationLogId: 'nlog-1',
        recipientPhoneNormalized: '+1234567890',
        smsBody: 'Your OTP is 000000',
      });

      await processSmsJob(job, updateStatus, updateNotificationLog);

      expect(updateNotificationLog).toHaveBeenCalledWith(
        'nlog-1',
        'sent',
        expect.objectContaining({ providerMessageId: expect.any(String) }),
      );
    });

    it('does not pass raw OTP from smsBody into updateNotificationLog calls', async () => {
      const updateStatus = jest.fn().mockResolvedValue(undefined);
      const updateNotificationLog = createUpdateNotificationLog();
      const rawOtp = '999888';
      const job = createMockJob('sms.send', {
        notificationLogId: 'nlog-2',
        recipientPhoneNormalized: '+1234567890',
        smsBody: `Your code is ${rawOtp}`,
      });

      await processSmsJob(job, updateStatus, updateNotificationLog);

      for (const call of updateNotificationLog.mock.calls) {
        expect(JSON.stringify(call)).not.toContain(rawOtp);
      }
    });

    it('does not call updateNotificationLog when notificationLogId is absent', async () => {
      const updateStatus = jest.fn().mockResolvedValue(undefined);
      const updateNotificationLog = createUpdateNotificationLog();
      const job = createMockJob('sms.send', {
        recipientPhoneNormalized: '+1234567890',
        smsBody: 'Hello',
      });

      await processSmsJob(job, updateStatus, updateNotificationLog);

      expect(updateNotificationLog).not.toHaveBeenCalled();
    });
  });
});
