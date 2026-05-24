import { Injectable } from '@nestjs/common';
import { maskPhone } from '../security/masking';
import { hashToken } from '../security/token-hasher';
import { NotificationLogRepository, type UpdateNotificationLogInput } from './notification-log.repository';
import type { NotificationLogDocument } from './notification-log.schema';
import type {
  CreateNotificationLogInput,
  CreateSmsNotificationLogInput,
  NotificationStatus,
} from './notification-log.types';

@Injectable()
export class NotificationLogService {
  constructor(private readonly notificationLogRepository: NotificationLogRepository) {}

  logSmsQueued(input: Omit<CreateSmsNotificationLogInput, 'status'>) {
    return this.createSmsLog({ ...input, status: 'queued' });
  }

  logSmsSent(input: Omit<CreateSmsNotificationLogInput, 'status'>) {
    return this.createSmsLog({ ...input, status: 'sent' });
  }

  logSmsFailed(input: Omit<CreateSmsNotificationLogInput, 'status'>) {
    return this.createSmsLog({ ...input, status: 'failed' });
  }

  logSmsSkipped(input: Omit<CreateSmsNotificationLogInput, 'status'>) {
    return this.createSmsLog({ ...input, status: 'skipped' });
  }

  updateStatus(
    id: string,
    status: NotificationStatus,
    updates?: UpdateNotificationLogInput,
  ): Promise<void> {
    return this.notificationLogRepository.updateStatus(id, status, updates);
  }

  private createSmsLog(input: CreateSmsNotificationLogInput): Promise<NotificationLogDocument> {
    const logInput: CreateNotificationLogInput = {
      channel: 'sms',
      provider: input.provider,
      recipientMasked: maskPhone(input.recipientPhoneNormalized),
      recipientHash: hashToken(input.recipientPhoneNormalized),
      status: input.status,
    };

    if (input.templateKey !== undefined) {
      logInput.templateKey = input.templateKey;
    }

    if (input.purpose !== undefined) {
      logInput.purpose = input.purpose;
    }

    if (input.providerMessageId !== undefined) {
      logInput.providerMessageId = input.providerMessageId;
    }

    if (input.errorCode !== undefined) {
      logInput.errorCode = input.errorCode;
    }

    if (input.errorMessage !== undefined) {
      logInput.errorMessage = input.errorMessage;
    }

    if (input.requestId !== undefined) {
      logInput.requestId = input.requestId;
    }

    if (input.correlationId !== undefined) {
      logInput.correlationId = input.correlationId;
    }

    return this.notificationLogRepository.createLog(logInput);
  }
}
