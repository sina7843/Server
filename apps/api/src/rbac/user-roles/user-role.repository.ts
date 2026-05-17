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

  async assignRole(input: AssignRoleInput): Promise<UserRoleDocument> {
    const created = await this.userRoleModel.create({
      userId: input.userId,
      roleId: input.roleId,
      ...(input.scopeType !== undefined ? { scopeType: input.scopeType } : {}),
      ...(input.scopeId !== undefined ? { scopeId: input.scopeId } : {}),
      ...(input.assignedBy !== undefined ? { assignedBy: input.assignedBy } : {}),
      assignedAt: input.assignedAt ?? new Date(),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
    });

    return created as UserRoleDocument;
  }

  removeUserRole(userRoleId: UserRoleId): Promise<UserRoleDocument | null> {
    return this.userRoleModel.findByIdAndDelete(userRoleId).exec();
  }

  removeUserRoleForUser(userId: string, userRoleId: UserRoleId): Promise<UserRoleDocument | null> {
    return this.userRoleModel.findOneAndDelete({ _id: userRoleId, userId }).exec();
  }

  findByUserId(userId: string): Promise<UserRoleDocument[]> {
    return this.userRoleModel.find({ userId }).exec();
  }

  findActiveByUserId(userId: string, now = new Date()): Promise<UserRoleDocument[]> {
    return this.userRoleModel
      .find({
        userId,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
      })
      .exec();
  }

  findByUserAndScope(userId: string, scope?: UserRoleScopeInput): Promise<UserRoleDocument[]> {
    const query: Record<string, unknown> = { userId };

    if (scope?.scopeType !== undefined) {
      query.scopeType = scope.scopeType;
    }

    if (scope?.scopeId !== undefined) {
      query.scopeId = scope.scopeId;
    }

    return this.userRoleModel.find(query).exec();
  }

  findByUserRoleAndScope(input: FindUserRoleInput): Promise<UserRoleDocument | null> {
    const query: Record<string, unknown> = {
      userId: input.userId,
      roleId: input.roleId,
      scopeType: input.scopeType ?? { $exists: false },
      scopeId: input.scopeId ?? { $exists: false },
    };

    return this.userRoleModel.findOne(query).exec();
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
}
