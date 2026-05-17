import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, type PermissionDocument } from './permission.schema';
import type {
  PermissionId,
  UpsertSystemPermissionInput,
} from './permission.types';

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
    return this.permissionModel.find({ key: { $in: [...keys] } }).exec();
  }

  list(): Promise<PermissionDocument[]> {
    return this.permissionModel.find().sort({ key: 1 }).exec();
  }

  listFiltered(
    input: {
      readonly module?: string;
      readonly resource?: string;
    } = {},
  ): Promise<PermissionDocument[]> {
    return this.permissionModel.find(input).sort({ key: 1 }).exec();
  }

  async upsertSystemPermission(
    input: UpsertSystemPermissionInput,
  ): Promise<PermissionDocument> {
    const updated = await this.permissionModel
      .findOneAndUpdate(
        { key: input.key },
        {
          $set: {
            key: input.key,
            module: input.module,
            resource: input.resource,
            action: input.action,
            ...(input.description !== undefined
              ? { description: input.description }
              : {}),
            isSystem: true,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();

    return updated as PermissionDocument;
  }

  async upsertSystemPermissionForSeed(
    input: UpsertSystemPermissionInput,
  ): Promise<{
    readonly document: PermissionDocument;
    readonly created: boolean;
    readonly updated: boolean;
  }> {
    const existing = await this.findByKey(input.key);
    const document = await this.upsertSystemPermission(input);

    return {
      document,
      created: !existing,
      updated: Boolean(existing),
    };
  }
}
