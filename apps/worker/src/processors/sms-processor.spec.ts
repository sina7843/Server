import { processSmsJob } from './sms-processor';
import type { NotificationLogStatusUpdater } from './processor-types';
import * as smsSender from '../sms/sms-sender';

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

    describe('provider failure path', () => {
      beforeEach(() => {
        jest.spyOn(smsSender, 'sendSmsDirectly').mockResolvedValue({
          status: 'failed',
          errorCode: 'provider_timeout',
          errorMessage: 'Request timed out.',
        });
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('marks NotificationLog as failed when provider returns failed', async () => {
        const updateStatus = jest.fn().mockResolvedValue(undefined);
        const updateNotificationLog = createUpdateNotificationLog();
        const job = createMockJob('sms.send', {
          notificationLogId: 'nlog-fail',
          recipientPhoneNormalized: '+1234567890',
          smsBody: 'Your OTP is 111111',
        });

        await expect(processSmsJob(job, updateStatus, updateNotificationLog)).rejects.toThrow();

        expect(updateNotificationLog).toHaveBeenCalledWith(
          'nlog-fail',
          'failed',
          expect.objectContaining({ errorCode: 'provider_timeout' }),
        );
      });

      it('does NOT mark JobLog as completed when provider returns failed', async () => {
        const updateStatus = jest.fn().mockResolvedValue(undefined);
        const updateNotificationLog = createUpdateNotificationLog();
        const job = createMockJob('sms.send', {
          jobLogId: 'log-fail',
          notificationLogId: 'nlog-fail',
          recipientPhoneNormalized: '+1234567890',
          smsBody: 'Your OTP is 222222',
        });

        await expect(processSmsJob(job, updateStatus, updateNotificationLog)).rejects.toThrow();

        const completedCall = updateStatus.mock.calls.find((c) => c[1] === 'completed');
        expect(completedCall).toBeUndefined();
      });

      it('marks JobLog as failed (not completed) when provider returns failed', async () => {
        const updateStatus = jest.fn().mockResolvedValue(undefined);
        const updateNotificationLog = createUpdateNotificationLog();
        const job = createMockJob('sms.send', {
          jobLogId: 'log-fail',
          notificationLogId: 'nlog-fail',
          recipientPhoneNormalized: '+1234567890',
          smsBody: 'Your OTP is 333333',
        });

        await expect(processSmsJob(job, updateStatus, updateNotificationLog)).rejects.toThrow();

        expect(updateStatus).toHaveBeenCalledWith(
          'log-fail',
          'failed',
          expect.objectContaining({ error: expect.any(String) }),
        );
      });

      it('throws a safe error that does not contain raw OTP, phone, or SMS body', async () => {
        const updateStatus = jest.fn().mockResolvedValue(undefined);
        const updateNotificationLog = createUpdateNotificationLog();
        const job = createMockJob('sms.send', {
          jobLogId: 'log-fail',
          notificationLogId: 'nlog-fail',
          recipientPhoneNormalized: '+9876543210',
          smsBody: 'Secret OTP: 444555',
        });

        let thrownError: Error | undefined;
        try {
          await processSmsJob(job, updateStatus, updateNotificationLog);
        } catch (err) {
          thrownError = err as Error;
        }

        expect(thrownError).toBeDefined();
        expect(thrownError!.message).not.toContain('444555');
        expect(thrownError!.message).not.toContain('+9876543210');
        expect(thrownError!.message).not.toContain('Secret OTP');
      });

      it('error from JobLog failed update does not contain raw OTP or phone', async () => {
        const updateStatus = jest.fn().mockResolvedValue(undefined);
        const updateNotificationLog = createUpdateNotificationLog();
        const job = createMockJob('sms.send', {
          jobLogId: 'log-fail',
          notificationLogId: 'nlog-fail',
          recipientPhoneNormalized: '+9876543210',
          smsBody: 'Your OTP is 777888',
        });

        await expect(processSmsJob(job, updateStatus, updateNotificationLog)).rejects.toThrow();

        const failedCall = updateStatus.mock.calls.find((c) => c[1] === 'failed');
        const serialized = JSON.stringify(failedCall);
        expect(serialized).not.toContain('777888');
        expect(serialized).not.toContain('+9876543210');
      });
    });
  });
});
