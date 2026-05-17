export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

export type SmsDeliveryStatus = 'sent' | 'failed' | 'skipped';

export interface SendSmsInput {
  recipientPhoneNormalized: string;
  message: string;
  purpose?: string;
  requestId?: string;
  correlationId?: string;
}

export interface SendSmsResult {
  provider: string;
  status: SmsDeliveryStatus;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface SmsProvider {
  sendSms(input: SendSmsInput): Promise<SendSmsResult>;
}
