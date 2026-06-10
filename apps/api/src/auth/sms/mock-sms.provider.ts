import { Injectable, Logger } from '@nestjs/common';
import type { SendSmsInput, SendSmsResult, SmsProvider } from './sms-provider.interface';

@Injectable()
export class MockSmsProvider implements SmsProvider {
  readonly providerName = 'mock';
  private readonly logger = new Logger('MockSms');

  async sendSms(input: SendSmsInput): Promise<SendSmsResult> {
    const stableIdSource = input.requestId ?? input.correlationId ?? 'local';

    this.logger.warn(
      `[DEV] SMS to ${input.recipientPhoneNormalized}: ${input.message}`,
    );

    return {
      provider: this.providerName,
      status: 'sent',
      providerMessageId: `mock-${stableIdSource}`,
    };
  }
}
