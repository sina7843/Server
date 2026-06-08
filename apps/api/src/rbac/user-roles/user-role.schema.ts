import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'user_roles', timestamps: true })
export class UserRole {
  declare _id: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId })
  declare userId: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId })
  declare roleId: Types.ObjectId;

  @Prop({ trim: true })
  declare scopeType?: string;

  @Prop({ trim: true })
  declare scopeId?: string;

  @Prop({ type: SchemaTypes.ObjectId })
  declare assignedBy?: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  declare assignedAt: Date;

  @Prop()
  declare expiresAt?: Date;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type UserRoleDocument = HydratedDocument<UserRole>;
export const UserRoleSchema = SchemaFactory.createForClass(UserRole);

UserRoleSchema.index({ userId: 1, roleId: 1, scopeType: 1, scopeId: 1 }, { unique: true });
UserRoleSchema.index({ userId: 1 });
UserRoleSchema.index({ roleId: 1 });
UserRoleSchema.index({ expiresAt: 1 });
