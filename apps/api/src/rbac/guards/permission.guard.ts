import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_METADATA_KEY,
  type PermissionMetadata,
} from '../decorators/permission-metadata';
import { PermissionResolverService } from '../resolution/permission-resolver.service';

interface RequestWithAuth {
  readonly auth?: {
    readonly userId?: string;
  };
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionResolver: PermissionResolverService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<
      PermissionMetadata | undefined
    >(PERMISSION_METADATA_KEY, [context.getHandler(), context.getClass()]);

    if (!metadata || metadata.permissionKeys.length === 0) {
      throw new ForbiddenException('Permission is required.');
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const userId = request.auth?.userId;

    if (!userId) {
      throw new ForbiddenException('Permission denied.');
    }

    const resolution =
      await this.permissionResolver.resolveUserPermissions({ userId });

    if (resolution.isSuperAdmin) {
      return true;
    }

    const granted = new Set(resolution.permissionKeys);
    const allowed = metadata.requireAll
      ? metadata.permissionKeys.every((permission) => granted.has(permission))
      : metadata.permissionKeys.some((permission) => granted.has(permission));

    if (!allowed) {
      throw new ForbiddenException('Permission denied.');
    }

    return true;
  }
}
