import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { User } from '../auth/users/user.schema';
import { PROFILE_VISIBILITIES, type ProfileVisibility } from './profile.types';

@Schema({ collection: 'user_profiles', timestamps: true })
export class UserProfile {
  declare _id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: User.name, required: true })
  declare userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare username: string;

  @Prop({ required: true, trim: true, lowercase: true })
  declare usernameNormalized: string;

  @Prop({ required: true, trim: true })
  declare displayName: string;

  @Prop({ type: SchemaTypes.ObjectId })
  declare avatarMediaId?: Types.ObjectId;

  @Prop({ trim: true })
  declare bio?: string;

  @Prop({ enum: PROFILE_VISIBILITIES, required: true, default: 'public' })
  declare visibility: ProfileVisibility;

  @Prop({ required: true, trim: true })
  declare publicUrl: string;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type UserProfileDocument = HydratedDocument<UserProfile>;
export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);

UserProfileSchema.index({ userId: 1 }, { unique: true });
UserProfileSchema.index({ usernameNormalized: 1 }, { unique: true });
UserProfileSchema.index({ visibility: 1 });
UserProfileSchema.index({ createdAt: 1 });
