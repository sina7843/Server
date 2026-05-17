import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({
  collection: 'role_permissions',
  timestamps: { createdAt: true, updatedAt: false },
})
export class RolePermission {
  declare _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  declare roleId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  declare permissionId: Types.ObjectId;

  declare createdAt: Date;
}

export type RolePermissionDocument = HydratedDocument<RolePermission>;
export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);

RolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });
RolePermissionSchema.index({ roleId: 1 });
RolePermissionSchema.index({ permissionId: 1 });
