import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, type PermissionDocument } from './permission.schema';
import type { PermissionId, SystemPermissionInput } from './permission.types';
import type { PermissionListFilter } from './permission.service';

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  findById(permissionId: PermissionId): Promise<PermissionDocument | null> {
    return this.permissionModel.findById(permissionId).exec();
  }

  findByKey(key: string): Promise<PermissionDocument | null> {
    return this.permissionModel.findOne({ key }).exec();
  }

  findByKeys(keys: readonly string[]): Promise<PermissionDocument[]> {
    return this.permissionModel.find({ key: { $in: keys } }).exec();
  }

  list(): Promise<PermissionDocument[]> {
    return this.permissionModel.find({}).exec();
  }

  listFiltered(filter: PermissionListFilter): Promise<PermissionDocument[]> {
    return this.permissionModel.find(filter).exec();
  }

  upsertSystemPermission(input: SystemPermissionInput): Promise<PermissionDocument | null> {
    return this.permissionModel
      .findOneAndUpdate(
        { key: input.key },
        {
          $set: {
            key: input.key,
            module: input.module,
            resource: input.resource,
            action: input.action,
            ...(input.description !== undefined ? { description: input.description } : {}),
            isSystem: true,
          },
        },
        { new: true, upsert: true },
      )
      .exec();
  }

  async upsertSystemPermissionForSeed(input: SystemPermissionInput): Promise<{
    readonly document: PermissionDocument;
    readonly created: boolean;
    readonly updated: boolean;
  }> {
    const existing = await this.permissionModel.findOne({ key: input.key }).exec();
    const document = await this.upsertSystemPermission(input);

    return {
      document: document as PermissionDocument,
      created: !existing,
      updated: Boolean(existing),
    };
  }
}
