import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'roles', timestamps: true })
export class Role {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare key: string;

  @Prop({ required: true, trim: true })
  declare name: string;

  @Prop({ trim: true })
  declare description?: string;

  @Prop({ required: true, default: false })
  declare isSystem: boolean;

  @Prop({ required: true, default: true })
  declare isAssignable: boolean;

  @Prop({ required: true, default: true })
  declare isActive: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type RoleDocument = HydratedDocument<Role>;
export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ key: 1 }, { unique: true });
RoleSchema.index({ isActive: 1 });
RoleSchema.index({ isSystem: 1 });
