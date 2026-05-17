import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';

function createContext(userId?: string) {
  return {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({
      getRequest: () => ({
        auth: userId ? { userId } : undefined,
      }),
    }),
  } as never;
}

describe('PermissionGuard', () => {
  it('allows required permission', async () => {
    const guard = new PermissionGuard(
      {
        getAllAndOverride: jest.fn().mockReturnValue({
          permissionKeys: ['rbac.role.read'],
          requireAll: true,
        }),
      } as unknown as Reflector,
      {
        resolveUserPermissions: jest.fn().mockResolvedValue({
          permissionKeys: ['rbac.role.read'],
          roleKeys: ['admin'],
          isSuperAdmin: false,
        }),
      } as never,
    );

    await expect(guard.canActivate(createContext('user-1'))).resolves.toBe(true);
  });

  it('allows super_admin', async () => {
    const guard = new PermissionGuard(
      {
        getAllAndOverride: jest.fn().mockReturnValue({
          permissionKeys: ['rbac.role.update'],
          requireAll: true,
        }),
      } as unknown as Reflector,
      {
        resolveUserPermissions: jest.fn().mockResolvedValue({
          permissionKeys: [],
          roleKeys: ['super_admin'],
          isSuperAdmin: true,
        }),
      } as never,
    );

    await expect(guard.canActivate(createContext('user-1'))).resolves.toBe(true);
  });

  it('denies missing permission', async () => {
    const guard = new PermissionGuard(
      {
        getAllAndOverride: jest.fn().mockReturnValue({
          permissionKeys: ['rbac.role.update'],
          requireAll: true,
        }),
      } as unknown as Reflector,
      {
        resolveUserPermissions: jest.fn().mockResolvedValue({
          permissionKeys: ['rbac.role.read'],
          roleKeys: ['support'],
          isSuperAdmin: false,
        }),
      } as never,
    );

    await expect(guard.canActivate(createContext('user-1'))).rejects.toThrow(ForbiddenException);
  });

  it('denies missing auth context', async () => {
    const guard = new PermissionGuard(
      {
        getAllAndOverride: jest.fn().mockReturnValue({
          permissionKeys: ['rbac.role.read'],
          requireAll: true,
        }),
      } as unknown as Reflector,
      { resolveUserPermissions: jest.fn() } as never,
    );

    await expect(guard.canActivate(createContext())).rejects.toThrow(ForbiddenException);
  });

  it('denies missing metadata', async () => {
    const guard = new PermissionGuard(
      { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector,
      { resolveUserPermissions: jest.fn() } as never,
    );

    await expect(guard.canActivate(createContext('user-1'))).rejects.toThrow(ForbiddenException);
  });

  it('denies empty metadata', async () => {
    const guard = new PermissionGuard(
      {
        getAllAndOverride: jest.fn().mockReturnValue({
          permissionKeys: [],
          requireAll: true,
        }),
      } as unknown as Reflector,
      { resolveUserPermissions: jest.fn() } as never,
    );

    await expect(guard.canActivate(createContext('user-1'))).rejects.toThrow(ForbiddenException);
  });

  it('denies by default for users without roles', async () => {
    const guard = new PermissionGuard(
      {
        getAllAndOverride: jest.fn().mockReturnValue({
          permissionKeys: ['rbac.role.read'],
          requireAll: true,
        }),
      } as unknown as Reflector,
      {
        resolveUserPermissions: jest.fn().mockResolvedValue({
          permissionKeys: [],
          roleKeys: [],
          isSuperAdmin: false,
        }),
      } as never,
    );

    await expect(guard.canActivate(createContext('user-1'))).rejects.toThrow(ForbiddenException);
  });
});
