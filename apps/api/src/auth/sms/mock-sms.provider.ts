import { Injectable } from '@nestjs/common';
import type { SendSmsInput, SendSmsResult, SmsProvider } from './sms-provider.interface';

@Injectable()
export class MockSmsProvider implements SmsProvider {
  readonly providerName = 'mock';

  async sendSms(input: SendSmsInput): Promise<SendSmsResult> {
    const stableIdSource = input.requestId ?? input.correlationId ?? 'local';

    return {
      provider: this.providerName,
      status: 'sent',
      providerMessageId: `mock-${stableIdSource}`,
    };
  }
}
