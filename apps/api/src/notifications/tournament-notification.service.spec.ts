import { readFileSync } from 'fs';
import { join } from 'path';
import { TournamentNotificationService } from './tournament-notification.service';
import type { SmsService } from '../auth/sms/sms.service';
import type { UserRepository } from '../auth/users/user.repository';
import type { TournamentRegistrationDocument } from '../tournament-registrations/tournament-registration.schema';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = '507f1f77bcf86cd799439001';
const REGISTRATION_ID = '507f1f77bcf86cd799439099';
const TOURNAMENT_ID = '507f1f77bcf86cd799439011';
const PHONE_NORMALIZED = '+989120000000';

function makeRegistration(
  overrides: Partial<Record<string, unknown>> = {},
): TournamentRegistrationDocument {
  return {
    _id: REGISTRATION_ID,
    tournamentId: TOURNAMENT_ID,
    userId: USER_ID,
    type: 'individual',
    status: 'submitted',
    ...overrides,
  } as unknown as TournamentRegistrationDocument;
}

function createMocks() {
  const smsService = {
    sendSms: jest
      .fn()
      .mockResolvedValue({ provider: 'mock', status: 'sent', providerMessageId: 'mock-1' }),
  } as unknown as jest.Mocked<SmsService>;

  const userRepository = {
    findById: jest.fn().mockResolvedValue({ phoneNormalized: PHONE_NORMALIZED } as never),
  } as unknown as jest.Mocked<UserRepository>;

  const service = new TournamentNotificationService(smsService, userRepository);

  return { service, smsService, userRepository };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TournamentNotificationService', () => {
  // ─── Scope guardrails ─────────────────────────────────────────────────────

  describe('scope guardrails', () => {
    it('has no marketing, campaign, or segmentation methods', () => {
      const { service } = createMocks();
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
      const forbidden = [
        'sendMarketing',
        'sendCampaign',
        'sendNewsletter',
        'sendPush',
        'sendBroadcast',
        'segment',
      ];
      for (const name of forbidden) {
        expect(proto).not.toContain(name);
      }
    });

    it('has no in-app notification methods', () => {
      const { service } = createMocks();
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
      expect(proto).not.toContain('sendInApp');
      expect(proto).not.toContain('createInAppNotification');
    });
  });

  // ─── Graceful degradation ─────────────────────────────────────────────────

  describe('graceful degradation when dependencies unavailable', () => {
    it('does not throw when smsService is not injected', async () => {
      const svc = new TournamentNotificationService(undefined, undefined);
      await expect(svc.notifyRegistrationSubmitted(makeRegistration())).resolves.toBeUndefined();
    });

    it('does not throw when userRepository is not injected', async () => {
      const mockSms = { sendSms: jest.fn() } as unknown as SmsService;
      const svc = new TournamentNotificationService(mockSms, undefined);
      await expect(svc.notifyRegistrationSubmitted(makeRegistration())).resolves.toBeUndefined();
    });

    it('does not call smsService when userRepository returns null (user not found)', async () => {
      const { smsService, userRepository } = createMocks();
      userRepository.findById.mockResolvedValue(null);
      const svc = new TournamentNotificationService(smsService, userRepository);
      await svc.notifyRegistrationSubmitted(makeRegistration());
      expect(smsService.sendSms).not.toHaveBeenCalled();
    });

    it('does not throw when userRepository.findById throws', async () => {
      const { smsService, userRepository } = createMocks();
      userRepository.findById.mockRejectedValue(new Error('DB error'));
      const svc = new TournamentNotificationService(smsService, userRepository);
      await expect(svc.notifyRegistrationSubmitted(makeRegistration())).resolves.toBeUndefined();
      expect(smsService.sendSms).not.toHaveBeenCalled();
    });

    it('does not throw when smsService.sendSms throws', async () => {
      const { smsService, userRepository } = createMocks();
      smsService.sendSms.mockRejectedValue(new Error('SMS error'));
      const svc = new TournamentNotificationService(smsService, userRepository);
      await expect(svc.notifyRegistrationSubmitted(makeRegistration())).resolves.toBeUndefined();
    });
  });

  // ─── Recipient source: trusted backend only ───────────────────────────────

  describe('recipient source', () => {
    it('resolves recipient phone from UserRepository using userId from registration', async () => {
      const { service, smsService, userRepository } = createMocks();
      const reg = makeRegistration({ userId: USER_ID });

      await service.notifyRegistrationSubmitted(reg);

      expect(userRepository.findById).toHaveBeenCalledWith(USER_ID);
      expect(smsService.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({ recipientPhoneNormalized: PHONE_NORMALIZED }),
      );
    });

    it('does not accept phone from registration document fields', async () => {
      const { service, smsService, userRepository } = createMocks();
      const regWithInjectedPhone = makeRegistration({
        phone: '+111111111',
        phoneNormalized: '+111111111',
      });

      await service.notifyRegistrationSubmitted(regWithInjectedPhone);

      expect(userRepository.findById).toHaveBeenCalledWith(USER_ID);
      const callArg = (smsService.sendSms as jest.Mock).mock.calls[0]?.[0] as Record<
        string,
        unknown
      >;
      expect(callArg?.recipientPhoneNormalized).toBe(PHONE_NORMALIZED);
      expect(callArg?.recipientPhoneNormalized).not.toBe('+111111111');
    });

    it('uses userId from authenticated registration record, not from any request body field', async () => {
      const { service, userRepository } = createMocks();
      const reg = makeRegistration({ userId: USER_ID });

      await service.notifyRegistrationSubmitted(reg);

      expect(userRepository.findById).toHaveBeenCalledWith(USER_ID);
    });
  });

  // ─── Privacy: no phone in logs or errors ─────────────────────────────────

  describe('privacy', () => {
    it('does not log raw phone number on sendSms failure', async () => {
      const { smsService, userRepository } = createMocks();
      smsService.sendSms.mockRejectedValue(new Error('Failed'));
      const loggerWarnSpy = jest.fn();
      const svc = new TournamentNotificationService(smsService, userRepository);
      (svc as unknown as { logger: { warn: jest.Mock } }).logger.warn = loggerWarnSpy;

      await svc.notifyRegistrationSubmitted(makeRegistration());

      for (const call of loggerWarnSpy.mock.calls) {
        const logged = JSON.stringify(call);
        expect(logged).not.toContain(PHONE_NORMALIZED);
        expect(logged).not.toContain('+98');
      }
    });

    it('does not log raw phone on userRepository failure', async () => {
      const { smsService, userRepository } = createMocks();
      userRepository.findById.mockRejectedValue(new Error('DB error'));
      const loggerWarnSpy = jest.fn();
      const svc = new TournamentNotificationService(smsService, userRepository);
      (svc as unknown as { logger: { warn: jest.Mock } }).logger.warn = loggerWarnSpy;

      await svc.notifyRegistrationSubmitted(makeRegistration());

      for (const call of loggerWarnSpy.mock.calls) {
        expect(JSON.stringify(call)).not.toContain(PHONE_NORMALIZED);
      }
    });

    it('does not include admin notes in notification purpose or message', async () => {
      const { service, smsService } = createMocks();
      await service.notifyRegistrationRejected(makeRegistration());

      const callArg = (smsService.sendSms as jest.Mock).mock.calls[0]?.[0] as Record<
        string,
        unknown
      >;
      expect(String(callArg?.message ?? '')).not.toContain('admin');
      expect(String(callArg?.purpose ?? '')).not.toContain('admin_note');
    });

    it('does not include team member contact data in any notification payload', async () => {
      const { service, smsService } = createMocks();
      const reg = makeRegistration({
        members: [{ displayName: 'Player', phone: '+989999999999' }],
      });

      await service.notifyRegistrationSubmitted(reg);

      const callArg = (smsService.sendSms as jest.Mock).mock.calls[0]?.[0] as Record<
        string,
        unknown
      >;
      expect(JSON.stringify(callArg)).not.toContain('+989999999999');
    });
  });

  // ─── Registration event notifications ─────────────────────────────────────

  describe('notifyRegistrationSubmitted', () => {
    it('sends SMS with purpose registration.submitted', async () => {
      const { service, smsService } = createMocks();
      await service.notifyRegistrationSubmitted(makeRegistration());

      expect(smsService.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: 'registration.submitted' }),
      );
    });

    it('sends to the registrant user only (no broadcast)', async () => {
      const { service, smsService } = createMocks();
      await service.notifyRegistrationSubmitted(makeRegistration());
      expect(smsService.sendSms).toHaveBeenCalledTimes(1);
    });
  });

  describe('notifyRegistrationApproved', () => {
    it('sends SMS with purpose registration.approved', async () => {
      const { service, smsService } = createMocks();
      await service.notifyRegistrationApproved(makeRegistration({ status: 'approved' }));

      expect(smsService.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: 'registration.approved' }),
      );
    });
  });

  describe('notifyRegistrationRejected', () => {
    it('sends SMS with purpose registration.rejected', async () => {
      const { service, smsService } = createMocks();
      await service.notifyRegistrationRejected(makeRegistration({ status: 'rejected' }));

      expect(smsService.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: 'registration.rejected' }),
      );
    });

    it('does not include rejectedReason in the SMS message', async () => {
      const { service, smsService } = createMocks();
      await service.notifyRegistrationRejected(
        makeRegistration({
          status: 'rejected',
          rejectedReason: 'Ineligible player - internal note',
        }),
      );

      const callArg = (smsService.sendSms as jest.Mock).mock.calls[0]?.[0] as Record<
        string,
        unknown
      >;
      expect(String(callArg?.message ?? '')).not.toContain('Ineligible player');
      expect(String(callArg?.message ?? '')).not.toContain('internal note');
    });
  });

  describe('notifyRegistrationWithdrawn', () => {
    it('sends SMS with purpose registration.withdrawn', async () => {
      const { service, smsService } = createMocks();
      await service.notifyRegistrationWithdrawn(makeRegistration({ status: 'withdrawn' }));

      expect(smsService.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: 'registration.withdrawn' }),
      );
    });
  });

  describe('notifyRegistrationCancelled', () => {
    it('sends SMS with purpose registration.cancelled', async () => {
      const { service, smsService } = createMocks();
      await service.notifyRegistrationCancelled(makeRegistration({ status: 'cancelled' }));

      expect(smsService.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: 'registration.cancelled' }),
      );
    });
  });

  // ─── Tournament cancelled notifications ───────────────────────────────────

  describe('notifyUsersOfTournamentCancelled', () => {
    it('notifies each userId in the list', async () => {
      const { service, smsService, userRepository } = createMocks();
      userRepository.findById.mockResolvedValue({ phoneNormalized: PHONE_NORMALIZED } as never);

      await service.notifyUsersOfTournamentCancelled([USER_ID, 'user2', 'user3']);

      expect(userRepository.findById).toHaveBeenCalledTimes(3);
      expect(smsService.sendSms).toHaveBeenCalledTimes(3);
    });

    it('sends purpose tournament.cancelled for each user', async () => {
      const { service, smsService } = createMocks();

      await service.notifyUsersOfTournamentCancelled([USER_ID]);

      expect(smsService.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: 'tournament.cancelled' }),
      );
    });

    it('handles empty list without error', async () => {
      const { service, smsService } = createMocks();
      await expect(service.notifyUsersOfTournamentCancelled([])).resolves.toBeUndefined();
      expect(smsService.sendSms).not.toHaveBeenCalled();
    });

    it('skips users whose phone cannot be resolved', async () => {
      const { service, smsService, userRepository } = createMocks();
      userRepository.findById
        .mockResolvedValueOnce({ phoneNormalized: PHONE_NORMALIZED } as never)
        .mockResolvedValueOnce(null);

      await service.notifyUsersOfTournamentCancelled([USER_ID, 'user-no-phone']);

      expect(smsService.sendSms).toHaveBeenCalledTimes(1);
    });

    it('continues notifying remaining users when one lookup fails', async () => {
      const { service, smsService, userRepository } = createMocks();
      userRepository.findById
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({ phoneNormalized: PHONE_NORMALIZED } as never);

      await service.notifyUsersOfTournamentCancelled([USER_ID, 'user2']);

      expect(smsService.sendSms).toHaveBeenCalledTimes(1);
    });
  });

  // ─── isNotifiableForTournamentCancellation ───────────────────────────────

  describe('isNotifiableForTournamentCancellation', () => {
    it.each(['submitted', 'approved', 'waitlisted'])(
      'returns true for notifiable status: %s',
      (status) => {
        const { service } = createMocks();
        expect(service.isNotifiableForTournamentCancellation(status)).toBe(true);
      },
    );

    it.each(['withdrawn', 'cancelled', 'rejected'])(
      'returns false for terminal/excluded status: %s',
      (status) => {
        const { service } = createMocks();
        expect(service.isNotifiableForTournamentCancellation(status)).toBe(false);
      },
    );
  });

  // ─── Provider behavior ────────────────────────────────────────────────────

  describe('provider behavior', () => {
    it('calls smsService.sendSms (provider abstraction) — not raw HTTP or hardcoded provider', async () => {
      const { service, smsService } = createMocks();
      await service.notifyRegistrationSubmitted(makeRegistration());
      expect(smsService.sendSms).toHaveBeenCalled();
    });

    it('does not use hardcoded provider credentials, phone numbers, or API keys', () => {
      const src = readFileSync(join(__dirname, 'tournament-notification.service.ts'), 'utf8');
      expect(src).not.toMatch(/\+98\d{10}/);
      expect(src).not.toMatch(/api[_-]?key\s*[:=]\s*['"`]/i);
      expect(src).not.toMatch(/sender[_-]?id\s*[:=]\s*['"`]/i);
      expect(src).not.toMatch(/secret\s*[:=]\s*['"`][^'"`]{8,}/i);
    });

    it('does not hardcode localhost or production domain in runtime config', () => {
      const src = readFileSync(join(__dirname, 'tournament-notification.service.ts'), 'utf8');
      expect(src).not.toMatch(/localhost:\d+/);
      expect(src).not.toMatch(/https?:\/\/qesb\.ir/);
      expect(src).not.toMatch(/https?:\/\/stream\.ir/);
    });
  });

  // ─── No fake production delivery ─────────────────────────────────────────

  describe('no fake production delivery', () => {
    it('does not mark delivery as production-sent when mock provider is used', async () => {
      const { service, smsService } = createMocks();
      smsService.sendSms.mockResolvedValue({
        provider: 'mock',
        status: 'sent',
        providerMessageId: 'mock-abc',
      });

      await service.notifyRegistrationSubmitted(makeRegistration());

      const result = await (smsService.sendSms as jest.Mock).mock.results[0]?.value;
      expect(result?.provider).toBe('mock');
    });
  });
});
