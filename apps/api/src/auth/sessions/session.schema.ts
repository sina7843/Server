import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { User } from '../users/user.schema';

@Schema({ collection: 'sessions', timestamps: true })
export class Session {
  declare _id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: User.name, required: true })
  declare userId: Types.ObjectId;

  @Prop({ required: true })
  declare refreshTokenHash: string;

  @Prop({ trim: true })
  declare accessTokenJti?: string;

  @Prop({ trim: true })
  declare deviceId?: string;

  @Prop({ trim: true })
  declare deviceName?: string;

  @Prop({ trim: true })
  declare ip?: string;

  @Prop({ trim: true })
  declare userAgent?: string;

  @Prop({ required: true })
  declare expiresAt: Date;

  @Prop()
  declare revokedAt?: Date;

  @Prop({ trim: true })
  declare revokedReason?: string;

  @Prop()
  declare lastUsedAt?: Date;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type SessionDocument = HydratedDocument<Session>;
export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ userId: 1 });
SessionSchema.index({ refreshTokenHash: 1 });
SessionSchema.index({ expiresAt: 1 });
SessionSchema.index({ revokedAt: 1 });
