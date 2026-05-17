import { OtpChallengeService } from "./otp.service";
import type { OtpChallengeState } from "./otp.types";

describe("OtpChallengeService", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  function createChallenge(
    overrides: Partial<OtpChallengeState> = {},
  ): OtpChallengeState {
    return {
      attempts: 0,
      expiresAt: new Date("2026-01-01T00:05:00.000Z"),
      maxAttempts: 5,
      ...overrides,
    };
  }

  it("marks expired challenges as not attemptable", () => {
    const service = new OtpChallengeService();
    const challenge = createChallenge({
      expiresAt: new Date("2025-12-31T23:59:59.000Z"),
    });

    expect(service.isExpired(challenge, now)).toBe(true);
    expect(service.canAttemptVerification(challenge, now)).toBe(false);
  });

  it("marks consumed challenges as not attemptable", () => {
    const service = new OtpChallengeService();
    const challenge = createChallenge({ consumedAt: now });

    expect(service.isConsumed(challenge)).toBe(true);
    expect(service.canAttemptVerification(challenge, now)).toBe(false);
  });

  it("rejects challenges with no attempts remaining", () => {
    const service = new OtpChallengeService();
    const challenge = createChallenge({ attempts: 5, maxAttempts: 5 });

    expect(service.hasAttemptsRemaining(challenge)).toBe(false);
    expect(service.canAttemptVerification(challenge, now)).toBe(false);
  });

  it("allows valid unexpired and unconsumed challenges with attempts remaining", () => {
    const service = new OtpChallengeService();
    const challenge = createChallenge({ attempts: 1, maxAttempts: 5 });

    expect(service.canAttemptVerification(challenge, now)).toBe(true);
  });

  it("calculates resend cooldown correctly", () => {
    const service = new OtpChallengeService();

    expect(service.calculateNextResendAt(90, now)).toEqual(
      new Date("2026-01-01T00:01:30.000Z"),
    );
  });

  it("rejects resend before nextResendAt", () => {
    const service = new OtpChallengeService();
    const challenge = createChallenge({
      nextResendAt: new Date("2026-01-01T00:01:00.000Z"),
    });

    expect(service.canResend(challenge, now)).toBe(false);
    expect(() => service.assertCanResend(challenge, now)).toThrow(
      "OTP resend cooldown is still active.",
    );
  });

  it("allows resend when cooldown has passed", () => {
    const service = new OtpChallengeService();
    const challenge = createChallenge({
      nextResendAt: new Date("2025-12-31T23:59:00.000Z"),
    });

    expect(service.canResend(challenge, now)).toBe(true);
  });

  it("throws when an invalid challenge attempts verification", () => {
    const service = new OtpChallengeService();
    const challenge = createChallenge({ attempts: 5, maxAttempts: 5 });

    expect(() => service.assertCanAttemptVerification(challenge, now)).toThrow(
      "OTP challenge cannot be used for verification.",
    );
  });
});
