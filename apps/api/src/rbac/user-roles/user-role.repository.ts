import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRole, type UserRoleDocument } from './user-role.schema';
import type {
  AssignRoleInput,
  FindUserRoleInput,
  UserRoleId,
  UserRoleScopeInput,
} from './user-role.types';

@Injectable()
export class UserRoleRepository {
  constructor(
    @InjectModel(UserRole.name)
    private readonly userRoleModel: Model<UserRoleDocument>,
  ) {}

  findById(userRoleId: UserRoleId): Promise<UserRoleDocument | null> {
    return this.userRoleModel.findById(userRoleId).exec();
  }

  findByUserId(userId: string): Promise<UserRoleDocument[]> {
    return this.userRoleModel.find({ userId }).exec();
  }

  findActiveByUserId(
    userId: string,
    now = new Date(),
  ): Promise<UserRoleDocument[]> {
    return this.userRoleModel
      .find({
        userId,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
      })
      .exec();
  }

  findByUserAndScope(
    userId: string,
    scope: UserRoleScopeInput = {},
  ): Promise<UserRoleDocument[]> {
    return this.userRoleModel
      .find({ userId, ...this.buildScopeFilter(scope) })
      .exec();
  }

  findByUserRoleAndScope(
    input: FindUserRoleInput,
  ): Promise<UserRoleDocument | null> {
    return this.userRoleModel
      .findOne({
        userId: input.userId,
        roleId: input.roleId,
        ...this.buildScopeFilter(input),
      })
      .exec();
  }

  async assignRole(input: AssignRoleInput): Promise<UserRoleDocument> {
    const createInput: Record<string, Date | string> = {
      userId: String(input.userId),
      roleId: String(input.roleId),
      assignedAt: input.assignedAt ?? new Date(),
    };

    if (input.scopeType !== undefined) {
      createInput.scopeType = input.scopeType;
    }

    if (input.scopeId !== undefined) {
      createInput.scopeId = input.scopeId;
    }

    if (input.assignedBy !== undefined) {
      createInput.assignedBy = String(input.assignedBy);
    }

    if (input.expiresAt !== undefined) {
      createInput.expiresAt = input.expiresAt;
    }

    const created = await this.userRoleModel.create(createInput);

    return created as UserRoleDocument;
  }

  removeUserRole(userRoleId: UserRoleId): Promise<UserRoleDocument | null> {
    return this.userRoleModel.findByIdAndDelete(userRoleId).exec();
  }

  removeUserRoleForUser(
    userId: string,
    userRoleId: UserRoleId,
  ): Promise<UserRoleDocument | null> {
    return this.userRoleModel
      .findOneAndDelete({ _id: userRoleId, userId })
      .exec();
  }

  async assignRoleForSeed(input: AssignRoleInput): Promise<{
    readonly document: UserRoleDocument;
    readonly created: boolean;
  }> {
    const existing = await this.findByUserRoleAndScope({
      userId: input.userId,
      roleId: input.roleId,
      ...(input.scopeType !== undefined ? { scopeType: input.scopeType } : {}),
      ...(input.scopeId !== undefined ? { scopeId: input.scopeId } : {}),
    });

    if (existing) {
      return {
        document: existing,
        created: false,
      };
    }

    const document = await this.assignRole(input);

    return {
      document,
      created: true,
    };
  }

  private buildScopeFilter(
    scope: UserRoleScopeInput,
  ): Record<string, string | { $exists: false }> {
    return {
      scopeType: scope.scopeType ?? { $exists: false },
      scopeId: scope.scopeId ?? { $exists: false },
    };
  }
}
