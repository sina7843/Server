import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, type RoleDocument } from './role.schema';
import type { CreateRoleInput, RoleId, UpdateRoleInput } from './role.types';

interface UpsertRoleForSeedInput {
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly isSystem: boolean;
  readonly isAssignable: boolean;
  readonly isActive: boolean;
}

@Injectable()
export class RoleRepository {
  constructor(@InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>) {}

  findById(roleId: RoleId): Promise<RoleDocument | null> {
    return this.roleModel.findById(roleId).exec();
  }

  findByKey(key: string): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ key }).exec();
  }

  list(): Promise<RoleDocument[]> {
    return this.roleModel.find({}).exec();
  }

  listActive(): Promise<RoleDocument[]> {
    return this.roleModel.find({ isActive: true }).exec();
  }

  async createRole(input: CreateRoleInput): Promise<RoleDocument> {
    const createInput: Record<string, boolean | string> = {
      key: input.key,
      name: input.name,
      isSystem: input.isSystem ?? false,
      isAssignable: input.isAssignable ?? true,
      isActive: input.isActive ?? true,
    };

    if (input.description !== undefined) {
      createInput.description = input.description;
    }

    const created = await this.roleModel.create(createInput);

    return created as RoleDocument;
  }

  updateRole(roleId: RoleId, input: UpdateRoleInput): Promise<RoleDocument | null> {
    const update: Record<string, boolean | string> = {};

    if (input.name !== undefined) {
      update.name = input.name;
    }

    if (input.description !== undefined) {
      update.description = input.description;
    }

    if (input.isAssignable !== undefined) {
      update.isAssignable = input.isAssignable;
    }

    if (input.isActive !== undefined) {
      update.isActive = input.isActive;
    }

    return this.roleModel.findByIdAndUpdate(roleId, { $set: update }, { new: true }).exec();
  }

  deactivateRole(roleId: RoleId): Promise<RoleDocument | null> {
    return this.roleModel
      .findByIdAndUpdate(roleId, { $set: { isActive: false } }, { new: true })
      .exec();
  }

  async upsertRoleForSeed(input: UpsertRoleForSeedInput): Promise<{
    readonly document: RoleDocument;
    readonly created: boolean;
    readonly updated: boolean;
  }> {
    const existing = await this.roleModel.findOne({ key: input.key }).exec();

    if (!existing) {
      const created = await this.roleModel.create(input);

      return {
        document: created as RoleDocument,
        created: true,
        updated: false,
      };
    }

    const updated = await this.roleModel
      .findOneAndUpdate(
        { key: input.key },
        {
          $set: {
            name: input.name,
            ...(input.description !== undefined ? { description: input.description } : {}),
            isSystem: input.isSystem,
            isAssignable: input.isAssignable,
            isActive: input.isActive,
          },
        },
        { new: true },
      )
      .exec();

    return {
      document: updated as RoleDocument,
      created: false,
      updated: true,
    };
  }
}
