export interface SmsSendInput {
  recipientPhoneNormalized: string;
  message: string;
  purpose?: string;
}

export interface SmsSendResult {
  status: 'sent' | 'failed';
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export async function sendSmsDirectly(input: SmsSendInput): Promise<SmsSendResult> {
  const stableId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  void input;
  return {
    status: 'sent',
    providerMessageId: stableId,
  };
}
