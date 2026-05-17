import { Injectable } from "@nestjs/common";
import type { OtpChallengeState } from "./otp.types";

@Injectable()
export class OtpChallengeService {
  isExpired(
    challenge: Pick<OtpChallengeState, "expiresAt">,
    now = new Date(),
  ): boolean {
    return challenge.expiresAt.getTime() <= now.getTime();
  }

  isVerified(challenge: Pick<OtpChallengeState, "verifiedAt">): boolean {
    return Boolean(challenge.verifiedAt);
  }

  isConsumed(challenge: Pick<OtpChallengeState, "consumedAt">): boolean {
    return Boolean(challenge.consumedAt);
  }

  hasAttemptsRemaining(
    challenge: Pick<OtpChallengeState, "attempts" | "maxAttempts">,
  ): boolean {
    return challenge.attempts < challenge.maxAttempts;
  }

  canAttemptVerification(
    challenge: OtpChallengeState,
    now = new Date(),
  ): boolean {
    return (
      !this.isExpired(challenge, now) &&
      !this.isConsumed(challenge) &&
      this.hasAttemptsRemaining(challenge)
    );
  }

  canResend(
    challenge: Pick<OtpChallengeState, "nextResendAt">,
    now = new Date(),
  ): boolean {
    return (
      !challenge.nextResendAt ||
      challenge.nextResendAt.getTime() <= now.getTime()
    );
  }

  assertCanAttemptVerification(
    challenge: OtpChallengeState,
    now = new Date(),
  ): void {
    if (!this.canAttemptVerification(challenge, now)) {
      throw new Error("OTP challenge cannot be used for verification.");
    }
  }

  assertCanResend(
    challenge: Pick<OtpChallengeState, "nextResendAt">,
    now = new Date(),
  ): void {
    if (!this.canResend(challenge, now)) {
      throw new Error("OTP resend cooldown is still active.");
    }
  }

  calculateNextResendAt(cooldownSeconds: number, now = new Date()): Date {
    if (!Number.isInteger(cooldownSeconds) || cooldownSeconds <= 0) {
      throw new Error("OTP resend cooldown must be a positive integer.");
    }

    return new Date(now.getTime() + cooldownSeconds * 1000);
  }
}
