import { Injectable } from '@nestjs/common';
import { UserRoleRepository } from './user-role.repository';
import type { UserRoleDocument } from './user-role.schema';
import type {
  AssignRoleInput,
  FindUserRoleInput,
  UserRoleId,
  UserRoleScopeInput,
} from './user-role.types';

@Injectable()
export class UserRoleService {
  constructor(private readonly userRoleRepository: UserRoleRepository) {}

  async assignRole(input: AssignRoleInput): Promise<UserRoleDocument> {
    const existing = await this.userRoleRepository.findByUserRoleAndScope({
      userId: input.userId,
      roleId: input.roleId,
      ...(input.scopeType !== undefined ? { scopeType: input.scopeType } : {}),
      ...(input.scopeId !== undefined ? { scopeId: input.scopeId } : {}),
    });

    if (existing) {
      return existing;
    }

    return this.userRoleRepository.assignRole(input);
  }

  removeUserRole(userRoleId: UserRoleId): Promise<UserRoleDocument | null> {
    return this.userRoleRepository.removeUserRole(userRoleId);
  }

  removeUserRoleForUser(
    userId: string,
    userRoleId: UserRoleId,
  ): Promise<UserRoleDocument | null> {
    return this.userRoleRepository.removeUserRoleForUser(userId, userRoleId);
  }

  findByUserId(userId: string): Promise<UserRoleDocument[]> {
    return this.userRoleRepository.findByUserId(userId);
  }

  findActiveByUserId(
    userId: string,
    now = new Date(),
  ): Promise<UserRoleDocument[]> {
    return this.userRoleRepository.findActiveByUserId(userId, now);
  }

  findByUserAndScope(
    userId: string,
    scope?: UserRoleScopeInput,
  ): Promise<UserRoleDocument[]> {
    return this.userRoleRepository.findByUserAndScope(userId, scope);
  }

  findByUserRoleAndScope(
    input: FindUserRoleInput,
  ): Promise<UserRoleDocument | null> {
    return this.userRoleRepository.findByUserRoleAndScope(input);
  }

  assignRoleForSeed(input: AssignRoleInput) {
    return this.userRoleRepository.assignRoleForSeed(input);
  }
}
