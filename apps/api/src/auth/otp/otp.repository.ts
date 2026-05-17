import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  OtpChallenge,
  type OtpChallengeDocument,
} from "./otp-challenge.schema";
import type { OtpPurpose } from "./otp-purpose";
import type { CreateOtpChallengeInput, OtpChallengeId } from "./otp.types";

@Injectable()
export class OtpChallengeRepository {
  constructor(
    @InjectModel(OtpChallenge.name)
    private readonly otpChallengeModel: Model<OtpChallengeDocument>,
  ) {}

  async createChallenge(
    input: CreateOtpChallengeInput,
  ): Promise<OtpChallengeDocument> {
    const created = await this.otpChallengeModel.create({
      phoneNormalized: input.phoneNormalized,
      purpose: input.purpose,
      codeHash: input.codeHash,
      expiresAt: input.expiresAt,
      attempts: 0,
      maxAttempts: input.maxAttempts,
      resendCount: 0,
      nextResendAt: input.nextResendAt,
      ip: input.ip,
      userAgent: input.userAgent,
      requestId: input.requestId,
    });

    return created as OtpChallengeDocument;
  }

  findLatestActiveByPhoneAndPurpose(
    phoneNormalized: string,
    purpose: OtpPurpose,
    now = new Date(),
  ): Promise<OtpChallengeDocument | null> {
    return this.otpChallengeModel
      .findOne({
        phoneNormalized,
        purpose,
        consumedAt: { $exists: false },
        expiresAt: { $gt: now },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  incrementAttempts(
    challengeId: OtpChallengeId,
  ): Promise<OtpChallengeDocument | null> {
    return this.otpChallengeModel
      .findByIdAndUpdate(challengeId, { $inc: { attempts: 1 } }, { new: true })
      .exec();
  }

  markVerified(
    challengeId: OtpChallengeId,
    verifiedAt = new Date(),
  ): Promise<OtpChallengeDocument | null> {
    return this.otpChallengeModel
      .findByIdAndUpdate(challengeId, { $set: { verifiedAt } }, { new: true })
      .exec();
  }

  markConsumed(
    challengeId: OtpChallengeId,
    consumedAt = new Date(),
  ): Promise<OtpChallengeDocument | null> {
    return this.otpChallengeModel
      .findByIdAndUpdate(challengeId, { $set: { consumedAt } }, { new: true })
      .exec();
  }

  incrementResendCount(
    challengeId: OtpChallengeId,
  ): Promise<OtpChallengeDocument | null> {
    return this.otpChallengeModel
      .findByIdAndUpdate(
        challengeId,
        { $inc: { resendCount: 1 } },
        { new: true },
      )
      .exec();
  }

  setNextResendAt(
    challengeId: OtpChallengeId,
    nextResendAt: Date,
  ): Promise<OtpChallengeDocument | null> {
    return this.otpChallengeModel
      .findByIdAndUpdate(challengeId, { $set: { nextResendAt } }, { new: true })
      .exec();
  }

  findRecentByPhoneAndPurpose(
    phoneNormalized: string,
    purpose: OtpPurpose,
    createdSince: Date,
  ): Promise<OtpChallengeDocument[]> {
    return this.otpChallengeModel
      .find({
        phoneNormalized,
        purpose,
        createdAt: { $gte: createdSince },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  findUnconsumedByPhoneAndPurpose(
    phoneNormalized: string,
    purpose: OtpPurpose,
    now = new Date(),
  ): Promise<OtpChallengeDocument[]> {
    return this.otpChallengeModel
      .find({
        phoneNormalized,
        purpose,
        consumedAt: { $exists: false },
        expiresAt: { $gt: now },
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}
