import type { Model } from 'mongoose';
import { NotificationLogRepository } from './notification-log.repository';
import { NotificationLogSchema, type NotificationLogDocument } from './notification-log.schema';

describe('NotificationLogRepository', () => {
  function createRepository() {
    const exec = jest.fn().mockResolvedValue(null);
    const sort = jest.fn().mockReturnValue({ exec });
    const create = jest.fn().mockResolvedValue({});
    const find = jest.fn().mockReturnValue({ sort });
    const findOne = jest.fn().mockReturnValue({ exec });
    const model = {
      create,
      find,
      findOne,
    } as unknown as Model<NotificationLogDocument>;

    return {
      create,
      find,
      findOne,
      repository: new NotificationLogRepository(model),
      sort,
    };
  }

  it('creates safe notification log entries without raw recipient or message fields', async () => {
    const { create, repository } = createRepository();

    await repository.createLog({
      channel: 'sms',
      provider: 'mock',
      recipientMasked: '***00',
      recipientHash: 'hashed-recipient',
      purpose: 'phone_verification',
      status: 'sent',
      providerMessageId: 'mock-message-1',
    });

    expect(create).toHaveBeenCalledWith({
      channel: 'sms',
      provider: 'mock',
      recipientMasked: '***00',
      recipientHash: 'hashed-recipient',
      templateKey: undefined,
      purpose: 'phone_verification',
      status: 'sent',
      providerMessageId: 'mock-message-1',
      errorCode: undefined,
      errorMessage: undefined,
      requestId: undefined,
      correlationId: undefined,
    });
    expect(create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        recipientPhoneNormalized: expect.anything(),
        message: expect.anything(),
      }),
    );
  });

  it('finds logs by provider message id', async () => {
    const { findOne, repository } = createRepository();

    await repository.findByProviderMessageId('mock-message-1');

    expect(findOne).toHaveBeenCalledWith({ providerMessageId: 'mock-message-1' });
  });

  it('finds recent logs by recipient hash only', async () => {
    const { find, repository, sort } = createRepository();
    const since = new Date('2026-01-01T00:00:00.000Z');

    await repository.findRecentByRecipientHash('hashed-recipient', since);

    expect(find).toHaveBeenCalledWith({
      recipientHash: 'hashed-recipient',
      createdAt: { $gte: since },
    });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('declares required schema indexes', () => {
    const indexes = NotificationLogSchema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ recipientHash: 1, createdAt: -1 }, expect.any(Object)],
        [{ status: 1, createdAt: -1 }, expect.any(Object)],
        [{ providerMessageId: 1 }, expect.any(Object)],
      ]),
    );
  });
});
