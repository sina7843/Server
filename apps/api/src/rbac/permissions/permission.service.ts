import { Injectable } from '@nestjs/common';
import { PermissionRepository } from './permission.repository';
import type { PermissionDocument } from './permission.schema';
import type { PermissionId, SystemPermissionInput } from './permission.types';

export interface PermissionListFilter {
  readonly module?: string;
  readonly resource?: string;
}

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

  listFiltered(filter: PermissionListFilter): Promise<PermissionDocument[]> {
    return this.permissionRepository.listFiltered(filter);
  }

  upsertSystemPermission(input: SystemPermissionInput): Promise<PermissionDocument | null> {
    return this.permissionRepository.upsertSystemPermission({
      ...input,
    });
  }

  upsertSystemPermissionForSeed(input: SystemPermissionInput) {
    return this.permissionRepository.upsertSystemPermissionForSeed(input);
  }
}
