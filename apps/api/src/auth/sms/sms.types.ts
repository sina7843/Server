import type { SmsDeliveryStatus } from './sms-provider.interface';

export interface SendAuthSmsInput {
  recipientPhoneNormalized: string;
  message: string;
  purpose?: string;
  requestId?: string;
  correlationId?: string;
}

export interface AuthSmsResult {
  provider: string;
  status: SmsDeliveryStatus;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}
