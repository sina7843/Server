import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OTP_PURPOSES, type OtpPurpose } from './otp-purpose';

@Schema({ collection: 'otp_challenges', timestamps: true })
export class OtpChallenge {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare phoneNormalized: string;

  @Prop({ enum: OTP_PURPOSES, required: true })
  declare purpose: OtpPurpose;

  @Prop({ required: true })
  declare codeHash: string;

  @Prop({ required: true })
  declare expiresAt: Date;

  @Prop()
  declare verifiedAt?: Date;

  @Prop()
  declare consumedAt?: Date;

  @Prop({ default: 0, min: 0, required: true })
  declare attempts: number;

  @Prop({ default: 5, min: 1, required: true })
  declare maxAttempts: number;

  @Prop({ default: 0, min: 0, required: true })
  declare resendCount: number;

  @Prop()
  declare nextResendAt?: Date;

  @Prop({ trim: true })
  declare ip?: string;

  @Prop({ trim: true })
  declare userAgent?: string;

  @Prop({ trim: true })
  declare requestId?: string;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type OtpChallengeDocument = HydratedDocument<OtpChallenge>;
export const OtpChallengeSchema = SchemaFactory.createForClass(OtpChallenge);

OtpChallengeSchema.index({ phoneNormalized: 1, purpose: 1, createdAt: -1 });
OtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpChallengeSchema.index({ phoneNormalized: 1, purpose: 1, consumedAt: 1 });
