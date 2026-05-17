import { Injectable } from '@nestjs/common';
import { PermissionRepository } from './permission.repository';
import type { PermissionDocument } from './permission.schema';
import type { PermissionId, UpsertSystemPermissionInput } from './permission.types';

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  findById(permissionId: PermissionId): Promise<PermissionDocument | null> {
    return this.permissionRepository.findById(permissionId);
  }

  findByKey(key: string): Promise<PermissionDocument | null> {
    return this.permissionRepository.findByKey(key);
  }

  findByKeys(keys: readonly string[]): Promise<PermissionDocument[]> {
    return this.permissionRepository.findByKeys(keys);
  }

  list(): Promise<PermissionDocument[]> {
    return this.permissionRepository.list();
  }

  listFiltered(
    input: {
      readonly module?: string;
      readonly resource?: string;
    } = {},
  ): Promise<PermissionDocument[]> {
    return this.permissionRepository.listFiltered(input);
  }

  upsertSystemPermission(input: UpsertSystemPermissionInput): Promise<PermissionDocument> {
    return this.permissionRepository.upsertSystemPermission(input);
  }

  upsertSystemPermissionForSeed(input: UpsertSystemPermissionInput) {
    return this.permissionRepository.upsertSystemPermissionForSeed(input);
  }
}
