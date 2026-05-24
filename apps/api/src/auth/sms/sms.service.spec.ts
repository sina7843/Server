import type { JobLogService } from '../../jobs/job-log.service';
import { NotificationLogService } from '../notifications/notification-log.service';
import { MockSmsProvider } from './mock-sms.provider';
import type { SmsProvider } from './sms-provider.interface';
import { SmsService } from './sms.service';

describe('MockSmsProvider', () => {
  it('returns provider mock without requiring credentials', async () => {
    const provider = new MockSmsProvider();

    const result = await provider.sendSms({
      recipientPhoneNormalized: '+989120000000',
      message: 'Your code is 123456',
      requestId: 'request-1',
    });

    expect(result).toEqual({
      provider: 'mock',
      status: 'sent',
      providerMessageId: 'mock-request-1',
    });
  });
});

describe('SmsService', () => {
  function createNotificationLogService() {
    return {
      logSmsFailed: jest.fn().mockResolvedValue({}),
      logSmsSent: jest.fn().mockResolvedValue({}),
      logSmsSkipped: jest.fn().mockResolvedValue({}),
      logSmsQueued: jest.fn().mockResolvedValue({ _id: 'notif-log-1' }),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<NotificationLogService>;
  }

  function createJobLogService() {
    return {
      enqueue: jest.fn().mockResolvedValue({ _id: 'job-log-1' }),
    } as unknown as jest.Mocked<JobLogService>;
  }

  it('calls the configured provider and logs sent status without storing the raw message', async () => {
    const provider: SmsProvider = {
      sendSms: jest.fn().mockResolvedValue({
        provider: 'mock',
        status: 'sent',
        providerMessageId: 'mock-message-1',
      }),
    };
    const notificationLogService = createNotificationLogService();
    const service = new SmsService(provider, notificationLogService);

    await service.sendSms({
      recipientPhoneNormalized: '+989120000000',
      message: 'Your code is 123456',
      purpose: 'phone_verification',
      requestId: 'request-1',
    });

    expect(provider.sendSms).toHaveBeenCalledWith({
      recipientPhoneNormalized: '+989120000000',
      message: 'Your code is 123456',
      purpose: 'phone_verification',
      requestId: 'request-1',
    });
    expect(notificationLogService.logSmsSent).toHaveBeenCalledWith({
      provider: 'mock',
      recipientPhoneNormalized: '+989120000000',
      providerMessageId: 'mock-message-1',
      purpose: 'phone_verification',
      requestId: 'request-1',
    });
    expect(notificationLogService.logSmsSent).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.anything() }),
    );
  });

  it('logs failed provider responses as failed', async () => {
    const provider: SmsProvider = {
      sendSms: jest.fn().mockResolvedValue({
        provider: 'mock',
        status: 'failed',
        errorCode: 'mock_failed',
        errorMessage: 'Mock failure.',
      }),
    };
    const notificationLogService = createNotificationLogService();
    const service = new SmsService(provider, notificationLogService);

    await service.sendSms({
      recipientPhoneNormalized: '+989120000000',
      message: 'Your code is 123456',
    });

    expect(notificationLogService.logSmsFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'mock',
        recipientPhoneNormalized: '+989120000000',
        errorCode: 'mock_failed',
        errorMessage: 'Mock failure.',
      }),
    );
  });

  it('sanitizes provider exception messages before logging failures', async () => {
    const provider: SmsProvider = {
      sendSms: jest.fn().mockRejectedValue(new Error('raw provider secret: OTP 123456')),
    };
    const notificationLogService = createNotificationLogService();
    const service = new SmsService(provider, notificationLogService);

    const result = await service.sendSms({
      recipientPhoneNormalized: '+989120000000',
      message: 'Your code is 123456',
    });

    expect(result).toEqual({
      provider: 'unknown',
      status: 'failed',
      errorCode: 'sms_provider_error',
      errorMessage: 'SMS provider failed.',
    });
    expect(notificationLogService.logSmsFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'unknown',
        recipientPhoneNormalized: '+989120000000',
        errorCode: 'sms_provider_error',
        errorMessage: 'SMS provider failed.',
      }),
    );
    expect(notificationLogService.logSmsFailed).not.toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: expect.stringContaining('raw provider secret'),
      }),
    );
  });

  describe('enqueueSms', () => {
    it('creates a queued NotificationLog and enqueues sms.send job', async () => {
      const provider: SmsProvider = { sendSms: jest.fn() };
      const notificationLogService = createNotificationLogService();
      const jobLogService = createJobLogService();
      const service = new SmsService(provider, notificationLogService, jobLogService);

      await service.enqueueSms({
        recipientPhoneNormalized: '+989120000000',
        message: 'Your code is 123456',
        purpose: 'phone_verification',
        requestId: 'req-1',
      });

      expect(notificationLogService.logSmsQueued).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'mock',
          recipientPhoneNormalized: '+989120000000',
          purpose: 'phone_verification',
        }),
      );
      expect(jobLogService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ queueName: 'sms', jobName: 'sms.send' }),
      );
    });

    it('does not include raw OTP message in job payload summary (smsBody is a redacted key)', async () => {
      const provider: SmsProvider = { sendSms: jest.fn() };
      const notificationLogService = createNotificationLogService();
      const jobLogService = createJobLogService();
      const service = new SmsService(provider, notificationLogService, jobLogService);

      await service.enqueueSms({
        recipientPhoneNormalized: '+989120000000',
        message: 'Your code is 123456',
      });

      const enqueuedPayload = (jobLogService.enqueue as jest.Mock).mock.calls[0]?.[0]
        ?.payload as Record<string, unknown>;
      expect(enqueuedPayload.smsBody).toBe('Your code is 123456');
      expect(enqueuedPayload.recipientPhoneNormalized).toBe('+989120000000');
    });

    it('falls back to synchronous sendSms when jobLogService is not available', async () => {
      const provider: SmsProvider = {
        sendSms: jest.fn().mockResolvedValue({ provider: 'mock', status: 'sent' }),
      };
      const notificationLogService = createNotificationLogService();
      const service = new SmsService(provider, notificationLogService);

      await service.enqueueSms({
        recipientPhoneNormalized: '+989120000000',
        message: 'Your code is 123456',
      });

      expect(provider.sendSms).toHaveBeenCalled();
      expect(notificationLogService.logSmsQueued).not.toHaveBeenCalled();
    });

    it('marks NotificationLog failed when enqueue throws', async () => {
      const provider: SmsProvider = { sendSms: jest.fn() };
      const notificationLogService = createNotificationLogService();
      const jobLogService = createJobLogService();
      (jobLogService.enqueue as jest.Mock).mockRejectedValue(new Error('Redis down'));
      const service = new SmsService(provider, notificationLogService, jobLogService);

      await service.enqueueSms({
        recipientPhoneNormalized: '+989120000000',
        message: 'Your code is 123456',
      });

      expect(notificationLogService.updateStatus).toHaveBeenCalledWith(
        'notif-log-1',
        'failed',
        expect.objectContaining({ errorCode: 'enqueue_failed' }),
      );
    });
  });

  it('logs skipped provider responses as skipped', async () => {
    const provider: SmsProvider = {
      sendSms: jest.fn().mockResolvedValue({
        provider: 'mock',
        status: 'skipped',
        errorCode: 'mock_skipped',
      }),
    };
    const notificationLogService = createNotificationLogService();
    const service = new SmsService(provider, notificationLogService);

    await service.sendSms({
      recipientPhoneNormalized: '+989120000000',
      message: 'Your code is 123456',
    });

    expect(notificationLogService.logSmsSkipped).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'mock',
        recipientPhoneNormalized: '+989120000000',
        errorCode: 'mock_skipped',
      }),
    );
  });
});
