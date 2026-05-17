/* global jest */
import type { SendAuthSmsInput } from '../../src/auth/sms/sms.types';

export function createMockSmsService() {
  return {
    sendSms: jest.fn().mockResolvedValue({
      provider: 'mock',
      status: 'sent',
      providerMessageId: 'mock-register',
    }),
    sentMessages: [] as SendAuthSmsInput[],
  };
}
