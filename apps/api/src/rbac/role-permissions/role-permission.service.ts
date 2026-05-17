import { Injectable } from '@nestjs/common';
import { RolePermissionRepository } from './role-permission.repository';
import type { RolePermissionDocument } from './role-permission.schema';
import type { AttachPermissionInput } from './role-permission.types';

@Injectable()
export class RolePermissionService {
  constructor(private readonly rolePermissionRepository: RolePermissionRepository) {}

  async attachPermission(input: AttachPermissionInput): Promise<RolePermissionDocument> {
    const existing = await this.rolePermissionRepository.findByRolePermission(input);

    if (existing) {
      return existing;
    }

    return this.rolePermissionRepository.attachPermission(input);
  }

  detachPermission(input: AttachPermissionInput): Promise<RolePermissionDocument | null> {
    return this.rolePermissionRepository.detachPermission(input);
  }

  findByRoleId(roleId: string): Promise<RolePermissionDocument[]> {
    return this.rolePermissionRepository.findByRoleId(roleId);
  }

  findPermissionIdsByRoleIds(roleIds: readonly string[]): Promise<string[]> {
    return this.rolePermissionRepository.findPermissionIdsByRoleIds(roleIds);
  }

  attachPermissionForSeed(input: AttachPermissionInput) {
    return this.rolePermissionRepository.attachPermissionForSeed(input);
  }
}
