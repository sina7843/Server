import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RolePermission, type RolePermissionDocument } from './role-permission.schema';
import type { AttachPermissionInput, RolePermissionId } from './role-permission.types';

@Injectable()
export class RolePermissionRepository {
  constructor(
    @InjectModel(RolePermission.name)
    private readonly rolePermissionModel: Model<RolePermissionDocument>,
  ) {}

  findById(rolePermissionId: RolePermissionId): Promise<RolePermissionDocument | null> {
    return this.rolePermissionModel.findById(rolePermissionId).exec();
  }

  findByRolePermission(input: AttachPermissionInput): Promise<RolePermissionDocument | null> {
    return this.rolePermissionModel
      .findOne({ roleId: input.roleId, permissionId: input.permissionId })
      .exec();
  }

  findByRoleId(roleId: string): Promise<RolePermissionDocument[]> {
    return this.rolePermissionModel.find({ roleId }).exec();
  }

  async findPermissionIdsByRoleIds(roleIds: readonly string[]): Promise<string[]> {
    const rolePermissions = await this.rolePermissionModel
      .find({ roleId: { $in: [...roleIds] } })
      .exec();

    return rolePermissions.map((rolePermission) => String(rolePermission.permissionId));
  }

  async attachPermission(input: AttachPermissionInput): Promise<RolePermissionDocument> {
    const created = await this.rolePermissionModel.create({
      roleId: input.roleId,
      permissionId: input.permissionId,
    });

    return created as RolePermissionDocument;
  }

  detachPermission(input: AttachPermissionInput): Promise<RolePermissionDocument | null> {
    return this.rolePermissionModel
      .findOneAndDelete({
        roleId: input.roleId,
        permissionId: input.permissionId,
      })
      .exec();
  }

  async attachPermissionForSeed(input: AttachPermissionInput): Promise<{
    readonly document: RolePermissionDocument;
    readonly created: boolean;
  }> {
    const existing = await this.findByRolePermission(input);

    if (existing) {
      return {
        document: existing,
        created: false,
      };
    }

    const document = await this.attachPermission(input);

    return {
      document,
      created: true,
    };
  }
}
