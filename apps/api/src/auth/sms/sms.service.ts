import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { JobLogService } from '../../jobs/job-log.service';
import { NotificationLogService } from '../notifications/notification-log.service';
import type { CreateSmsNotificationLogInput } from '../notifications/notification-log.types';
import { SMS_PROVIDER, type SendSmsResult, type SmsProvider } from './sms-provider.interface';
import type { AuthSmsResult, SendAuthSmsInput } from './sms.types';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
    private readonly notificationLogService: NotificationLogService,
    @Optional() private readonly jobLogService?: JobLogService,
  ) {}

  async sendSms(input: SendAuthSmsInput): Promise<AuthSmsResult> {
    const result = await this.sendThroughProvider(input);
    const logInput = this.createNotificationLogInput(input, result);

    if (result.status === 'sent') {
      await this.notificationLogService.logSmsSent(logInput);
    } else if (result.status === 'skipped') {
      await this.notificationLogService.logSmsSkipped(logInput);
    } else {
      await this.notificationLogService.logSmsFailed(logInput);
    }

    return result;
  }

  async enqueueSms(input: SendAuthSmsInput): Promise<void> {
    if (!this.jobLogService) {
      await this.sendSms(input);
      return;
    }

    const logInput: Omit<CreateSmsNotificationLogInput, 'status'> = {
      provider: 'mock',
      recipientPhoneNormalized: input.recipientPhoneNormalized,
    };
    if (input.purpose !== undefined) logInput.purpose = input.purpose;
    if (input.requestId !== undefined) logInput.requestId = input.requestId;
    if (input.correlationId !== undefined) logInput.correlationId = input.correlationId;

    const log = await this.notificationLogService.logSmsQueued(logInput);
    const notificationLogId = String(log._id);

    const payload: Record<string, unknown> = {
      notificationLogId,
      recipientPhoneNormalized: input.recipientPhoneNormalized,
      smsBody: input.message,
    };
    if (input.purpose !== undefined) payload.purpose = input.purpose;
    if (input.requestId !== undefined) payload.requestId = input.requestId;

    try {
      await this.jobLogService.enqueue({
        queueName: 'sms',
        jobName: 'sms.send',
        payload,
      });
    } catch (err) {
      this.logger.error('Failed to enqueue sms.send job', String(err));
      await this.notificationLogService
        .updateStatus(notificationLogId, 'failed', {
          errorCode: 'enqueue_failed',
          errorMessage: 'SMS job could not be enqueued.',
        })
        .catch(() => {});
    }
  }

  private createNotificationLogInput(
    input: SendAuthSmsInput,
    result: SendSmsResult,
  ): Omit<CreateSmsNotificationLogInput, 'status'> {
    const logInput: Omit<CreateSmsNotificationLogInput, 'status'> = {
      provider: result.provider,
      recipientPhoneNormalized: input.recipientPhoneNormalized,
    };

    if (result.providerMessageId !== undefined) {
      logInput.providerMessageId = result.providerMessageId;
    }

    if (input.purpose !== undefined) {
      logInput.purpose = input.purpose;
    }

    if (input.requestId !== undefined) {
      logInput.requestId = input.requestId;
    }

    if (input.correlationId !== undefined) {
      logInput.correlationId = input.correlationId;
    }

    if (result.errorCode !== undefined) {
      logInput.errorCode = result.errorCode;
    }

    if (result.errorMessage !== undefined) {
      logInput.errorMessage = result.errorMessage;
    }

    return logInput;
  }

  private async sendThroughProvider(input: SendAuthSmsInput): Promise<SendSmsResult> {
    try {
      return await this.smsProvider.sendSms(input);
    } catch {
      return {
        provider: 'unknown',
        status: 'failed',
        errorCode: 'sms_provider_error',
        errorMessage: 'SMS provider failed.',
      };
    }
  }
}
