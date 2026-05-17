import { Inject, Injectable } from '@nestjs/common';
import { NotificationLogService } from '../notifications/notification-log.service';
import type { CreateSmsNotificationLogInput } from '../notifications/notification-log.types';
import { SMS_PROVIDER, type SendSmsResult, type SmsProvider } from './sms-provider.interface';
import type { AuthSmsResult, SendAuthSmsInput } from './sms.types';

@Injectable()
export class SmsService {
  constructor(
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
    private readonly notificationLogService: NotificationLogService,
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
