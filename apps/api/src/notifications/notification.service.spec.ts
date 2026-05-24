import { NotificationService } from './notification.service';
import type { NotificationTemplateRepository } from './notification-template.repository';

const MOCK_LOG_ID = '64f000000000000000000001';

function createMocks() {
  const notificationLogModel = {
    create: jest.fn().mockResolvedValue({ _id: MOCK_LOG_ID, status: 'queued' }),
    findById: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: MOCK_LOG_ID, status: 'sent' }),
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
    countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
  };

  const templateRepository = {
    findTemplate: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
  } as unknown as jest.Mocked<NotificationTemplateRepository>;

  const service = new NotificationService(
    notificationLogModel as never,
    templateRepository,
  );

  return { service, notificationLogModel, templateRepository };
}

describe('NotificationService', () => {
  describe('createQueuedLog', () => {
    it('creates a log with status queued', async () => {
      const { service, notificationLogModel } = createMocks();

      const result = await service.createQueuedLog({
        channel: 'sms',
        provider: 'mock',
        recipientMasked: '***00',
        recipientHash: 'abc123hash',
      });

      expect(notificationLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'sms', status: 'queued', provider: 'mock' }),
      );
      expect(result._id).toBe(MOCK_LOG_ID);
    });

    it('stores recipientMasked and recipientHash without raw recipient', async () => {
      const { service, notificationLogModel } = createMocks();

      await service.createQueuedLog({
        channel: 'sms',
        provider: 'mock',
        recipientMasked: '***00',
        recipientHash: 'abc123hash',
      });

      const created = notificationLogModel.create.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(created.recipientMasked).toBe('***00');
      expect(created.recipientHash).toBe('abc123hash');
      expect(created).not.toHaveProperty('recipientPhoneNormalized');
    });
  });

  describe('createQueuedSmsLog', () => {
    it('masks and hashes phone before storing', async () => {
      const { service, notificationLogModel } = createMocks();

      await service.createQueuedSmsLog({
        provider: 'mock',
        recipientPhoneNormalized: '+989120000000',
      });

      const created = notificationLogModel.create.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(created.channel).toBe('sms');
      expect(typeof created.recipientMasked).toBe('string');
      expect(typeof created.recipientHash).toBe('string');
      expect(JSON.stringify(created)).not.toContain('+989120000000');
    });
  });

  describe('markSent', () => {
    it('updates status to sent with providerMessageId', async () => {
      const { service, notificationLogModel } = createMocks();

      await service.markSent(MOCK_LOG_ID, 'msg-123');

      expect(notificationLogModel.findByIdAndUpdate).toHaveBeenCalledWith(
        MOCK_LOG_ID,
        expect.objectContaining({ $set: expect.objectContaining({ status: 'sent', providerMessageId: 'msg-123' }) }),
      );
    });

    it('updates status to sent without providerMessageId when not provided', async () => {
      const { service, notificationLogModel } = createMocks();

      await service.markSent(MOCK_LOG_ID);

      const call = notificationLogModel.findByIdAndUpdate.mock.calls[0]?.[1] as Record<string, unknown>;
      const set = (call as { $set: Record<string, unknown> }).$set;
      expect(set.status).toBe('sent');
      expect(set).not.toHaveProperty('providerMessageId');
    });
  });

  describe('markFailed', () => {
    it('updates status to failed with sanitized error', async () => {
      const { service, notificationLogModel } = createMocks();

      await service.markFailed(MOCK_LOG_ID, 'provider_error', 'Connection timeout');

      expect(notificationLogModel.findByIdAndUpdate).toHaveBeenCalledWith(
        MOCK_LOG_ID,
        expect.objectContaining({ $set: expect.objectContaining({ status: 'failed', errorCode: 'provider_error' }) }),
      );
    });

    it('sanitizes error messages that contain sensitive words', async () => {
      const { service, notificationLogModel } = createMocks();

      await service.markFailed(MOCK_LOG_ID, 'err', 'Invalid token abc123 secret exposed');

      const call = notificationLogModel.findByIdAndUpdate.mock.calls[0]?.[1] as { $set: Record<string, unknown> };
      expect(call.$set.errorMessage).toBe('Provider error occurred.');
      expect(call.$set.errorMessage).not.toContain('token');
      expect(call.$set.errorMessage).not.toContain('secret');
    });
  });

  describe('markSkipped', () => {
    it('updates status to skipped', async () => {
      const { service, notificationLogModel } = createMocks();

      await service.markSkipped(MOCK_LOG_ID);

      expect(notificationLogModel.findByIdAndUpdate).toHaveBeenCalledWith(
        MOCK_LOG_ID,
        expect.objectContaining({ $set: expect.objectContaining({ status: 'skipped' }) }),
      );
    });
  });

  describe('getLog', () => {
    it('returns log by id', async () => {
      const { service } = createMocks();
      const result = await service.getLog(MOCK_LOG_ID);
      expect(result).toBeDefined();
    });
  });

  describe('listLogs', () => {
    it('returns paginated logs with total', async () => {
      const { service } = createMocks();
      const result = await service.listLogs({}, 1, 20);
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
    });
  });

  describe('renderTemplate', () => {
    it('replaces template variables with provided values', () => {
      const { service } = createMocks();
      const rendered = service.renderTemplate('Your code is {{code}} on {{date}}.', {
        code: '123456',
        date: '2026-01-01',
      });
      expect(rendered).toBe('Your code is 123456 on 2026-01-01.');
    });

    it('leaves unreplaced variables as-is', () => {
      const { service } = createMocks();
      const rendered = service.renderTemplate('Hello {{name}}!', {});
      expect(rendered).toBe('Hello {{name}}!');
    });
  });

  describe('security', () => {
    it('does not expose raw phone in createQueuedSmsLog', async () => {
      const { service, notificationLogModel } = createMocks();
      await service.createQueuedSmsLog({ provider: 'mock', recipientPhoneNormalized: '+989120000000' });
      const created = notificationLogModel.create.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(JSON.stringify(created)).not.toContain('+989120000000');
    });

    it('does not include raw OTP in markFailed error field', async () => {
      const { service, notificationLogModel } = createMocks();
      await service.markFailed(MOCK_LOG_ID, 'bad_otp', 'OTP 123456 is invalid');
      const call = notificationLogModel.findByIdAndUpdate.mock.calls[0]?.[1] as { $set: Record<string, unknown> };
      expect(String(call.$set.errorMessage)).not.toContain('123456');
    });
  });
});
