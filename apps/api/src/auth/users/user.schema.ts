import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { USER_STATUSES, type UserMetadata, type UserStatus } from './user.types';

@Schema({ collection: 'users', timestamps: true })
export class User {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare phone: string;

  @Prop({ required: true, trim: true })
  declare phoneNormalized: string;

  @Prop()
  declare phoneVerifiedAt?: Date;

  @Prop({ trim: true })
  declare email?: string;

  @Prop({ trim: true })
  declare emailNormalized?: string;

  @Prop()
  declare emailVerifiedAt?: Date;

  @Prop({ required: true })
  declare passwordHash: string;

  @Prop({ enum: USER_STATUSES, required: true, default: 'pending_verification' })
  declare status: UserStatus;

  @Prop({ trim: true })
  declare statusReason?: string;

  @Prop()
  declare lastLoginAt?: Date;

  @Prop({ trim: true })
  declare lastLoginIp?: string;

  @Prop({ required: true, default: 0, min: 0 })
  declare failedLoginCount: number;

  @Prop()
  declare lockedUntil?: Date;

  @Prop({
    type: {
      registrationSource: { type: String, trim: true },
      locale: { type: String, trim: true },
    },
    _id: false,
  })
  declare metadata?: UserMetadata;

  declare createdAt: Date;
  declare updatedAt: Date;

  @Prop()
  declare deletedAt?: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ phoneNormalized: 1 }, { unique: true });
UserSchema.index({ emailNormalized: 1 }, { unique: true, sparse: true });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: 1 });
UserSchema.index({ phoneVerifiedAt: 1 });
UserSchema.index({ status: 1, createdAt: 1 });
