import { ConflictException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { AuditAction } from '@dragon/types';
import { AuditService } from '../../audit/audit.service';
import { RoleRegistry } from '../registry/role-registry';
import { RoleRepository } from './role.repository';
import type { RoleDocument } from './role.schema';
import type { CreateRoleInput, RoleId, UpdateRoleInput } from './role.types';

const RESERVED_ROLE_KEYS: ReadonlySet<string> = new Set(RoleRegistry.map((role) => role.key));

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  findById(roleId: RoleId): Promise<RoleDocument | null> {
    return this.roleRepository.findById(roleId);
  }

  findByKey(key: string): Promise<RoleDocument | null> {
    return this.roleRepository.findByKey(key);
  }

  list(): Promise<RoleDocument[]> {
    return this.roleRepository.list();
  }

  listActive(): Promise<RoleDocument[]> {
    return this.roleRepository.listActive();
  }

  createRole(input: CreateRoleInput): Promise<RoleDocument> {
    return this.roleRepository.createRole(input);
  }

  async createAdminRole(
    input: Omit<CreateRoleInput, 'isSystem' | 'isActive'>,
  ): Promise<RoleDocument> {
    if (RESERVED_ROLE_KEYS.has(input.key)) {
      throw new ConflictException('Reserved role key cannot be created.');
    }

    const existing = await this.roleRepository.findByKey(input.key);

    if (existing) {
      throw new ConflictException('Role key already exists.');
    }

    const role = await this.roleRepository.createRole({
      key: input.key,
      name: input.name,
      ...(input.description !== undefined ? { description: input.description } : {}),
      isSystem: false,
      isAssignable: input.isAssignable ?? true,
      isActive: true,
    });

    void this.auditService?.log({
      actorType: 'admin',
      action: AuditAction.RBAC_ROLE_CREATED,
      resourceType: 'role',
      resourceId: String(role._id),
      after: { key: role.key, name: role.name },
      severity: 'info',
    });

    return role;
  }

  updateRole(roleId: RoleId, input: UpdateRoleInput): Promise<RoleDocument | null> {
    return this.roleRepository.updateRole(roleId, input);
  }

  async updateAdminRole(roleId: RoleId, input: UpdateRoleInput): Promise<RoleDocument | null> {
    const role = await this.roleRepository.findById(roleId);

    if (!role) {
      return null;
    }

    if (role.isSystem) {
      throw new ConflictException('System role cannot be modified.');
    }

    const updated = await this.roleRepository.updateRole(roleId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isAssignable !== undefined ? { isAssignable: input.isAssignable } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });

    if (updated) {
      void this.auditService?.log({
        actorType: 'admin',
        action: AuditAction.RBAC_ROLE_UPDATED,
        resourceType: 'role',
        resourceId: String(updated._id),
        after: { key: updated.key, name: updated.name },
        severity: 'info',
      });
    }

    return updated;
  }

  deactivateRole(roleId: RoleId): Promise<RoleDocument | null> {
    return this.roleRepository.deactivateRole(roleId);
  }

  async deactivateAdminRole(roleId: RoleId): Promise<RoleDocument> {
    const role = await this.roleRepository.findById(roleId);

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    if (role.isSystem) {
      throw new ConflictException('System role cannot be deactivated.');
    }

    const deactivated = await this.roleRepository.deactivateRole(roleId);

    if (!deactivated) {
      throw new NotFoundException('Role not found.');
    }

    void this.auditService?.log({
      actorType: 'admin',
      action: AuditAction.RBAC_ROLE_DEACTIVATED,
      resourceType: 'role',
      resourceId: String(deactivated._id),
      after: { key: deactivated.key, isActive: false },
      severity: 'warning',
    });

    return deactivated;
  }

  async findMutableAdminRoleById(roleId: RoleId): Promise<RoleDocument> {
    const role = await this.roleRepository.findById(roleId);

    if (!role || !role.isActive) {
      throw new NotFoundException('Role not found.');
    }

    if (role.isSystem) {
      throw new ConflictException('System role permission mappings are seed-owned.');
    }

    return role;
  }

  upsertRoleForSeed(input: Parameters<RoleRepository['upsertRoleForSeed']>[0]) {
    return this.roleRepository.upsertRoleForSeed(input);
  }
}
