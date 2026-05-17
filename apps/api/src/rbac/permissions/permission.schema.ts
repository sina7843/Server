import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'permissions', timestamps: true })
export class Permission {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare key: string;

  @Prop({ required: true, trim: true })
  declare module: string;

  @Prop({ required: true, trim: true })
  declare resource: string;

  @Prop({ required: true, trim: true })
  declare action: string;

  @Prop({ trim: true })
  declare description?: string;

  @Prop({ required: true, default: true, immutable: true })
  declare isSystem: true;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type PermissionDocument = HydratedDocument<Permission>;
export const PermissionSchema = SchemaFactory.createForClass(Permission);

PermissionSchema.index({ key: 1 }, { unique: true });
PermissionSchema.index({ module: 1, resource: 1, action: 1 }, { unique: true });
PermissionSchema.index({ module: 1, resource: 1 });
