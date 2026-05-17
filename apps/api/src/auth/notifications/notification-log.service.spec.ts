import { NotificationLogRepository } from './notification-log.repository';
import { NotificationLogService } from './notification-log.service';

describe('NotificationLogService', () => {
  function createService() {
    const repository = {
      createLog: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<NotificationLogRepository>;

    return {
      repository,
      service: new NotificationLogService(repository),
    };
  }

  it('stores masked and hashed recipient values for sent SMS logs', async () => {
    const { repository, service } = createService();

    await service.logSmsSent({
      provider: 'mock',
      recipientPhoneNormalized: '+989120000000',
      purpose: 'phone_verification',
      providerMessageId: 'mock-message-1',
    });

    expect(repository.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'sms',
        provider: 'mock',
        recipientMasked: '***00',
        status: 'sent',
        purpose: 'phone_verification',
        providerMessageId: 'mock-message-1',
      }),
    );
    expect(repository.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
  });

  it('does not store raw recipient phone or raw message fields', async () => {
    const { repository, service } = createService();

    await service.logSmsFailed({
      provider: 'mock',
      recipientPhoneNormalized: '+989120000000',
      errorCode: 'mock_failed',
      errorMessage: 'Mock failure.',
    });

    const payload = repository.createLog.mock.calls[0]?.[0];

    expect(payload).toBeDefined();
    expect(payload).not.toHaveProperty('recipientPhoneNormalized');
    expect(payload).not.toHaveProperty('message');
    expect(payload?.recipientMasked).not.toBe('+989120000000');
    expect(payload?.recipientHash).not.toBe('+989120000000');
  });

  it('logs failed SMS status', async () => {
    const { repository, service } = createService();

    await service.logSmsFailed({
      provider: 'mock',
      recipientPhoneNormalized: '+989120000000',
      errorCode: 'mock_failed',
    });

    expect(repository.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        errorCode: 'mock_failed',
      }),
    );
  });

  it('logs skipped SMS status', async () => {
    const { repository, service } = createService();

    await service.logSmsSkipped({
      provider: 'mock',
      recipientPhoneNormalized: '+989120000000',
      errorCode: 'mock_skipped',
    });

    expect(repository.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'skipped',
        errorCode: 'mock_skipped',
      }),
    );
  });
});
