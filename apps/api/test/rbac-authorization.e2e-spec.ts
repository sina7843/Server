/* global afterEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { AdminRolesController } from '../src/rbac/controllers/admin-roles.controller';
import { PermissionGuard } from '../src/rbac/guards/permission.guard';
import { PermissionService } from '../src/rbac/permissions/permission.service';
import { PermissionResolverService } from '../src/rbac/resolution/permission-resolver.service';
import { RolePermissionService } from '../src/rbac/role-permissions/role-permission.service';
import { RoleService } from '../src/rbac/roles/role.service';
import {
  createRbacRoleDocument,
  RBAC_TEST_TOKENS,
  RbacTestAccessTokenGuard,
} from './helpers/rbac-test.factory';

describe('RBAC authorization integration', () => {
  let app: INestApplication;
  const roleService = {
    list: jest.fn().mockResolvedValue([createRbacRoleDocument()]),
    createAdminRole: jest.fn(),
    findById: jest.fn(),
    updateAdminRole: jest.fn(),
    deactivateAdminRole: jest.fn(),
  };
  const permissionService = {
    findById: jest.fn(),
  };
  const rolePermissionService = {
    attachPermission: jest.fn(),
    detachPermission: jest.fn(),
  };

  async function createAppWithResolver(resolverResult: {
    readonly permissionKeys: readonly string[];
    readonly roleKeys: readonly string[];
    readonly isSuperAdmin: boolean;
  }) {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminRolesController],
      providers: [
        Reflector,
        PermissionGuard,
        {
          provide: PermissionResolverService,
          useValue: {
            resolveUserPermissions: jest.fn().mockResolvedValue(resolverResult),
          },
        },
        { provide: RoleService, useValue: roleService },
        { provide: PermissionService, useValue: permissionService },
        {
          provide: RolePermissionService,
          useValue: rolePermissionService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useClass(RbacTestAccessTokenGuard)
      .compile();

    const testApp = moduleRef.createNestApplication();
    await testApp.init();
    await testApp.listen(0);

    return testApp;
  }

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('allows a user when resolved permissions include the required key', async () => {
    app = await createAppWithResolver({
      permissionKeys: ['rbac.role.read'],
      roleKeys: ['admin'],
      isSuperAdmin: false,
    });

    const response = await fetch(`${await app.getUrl()}/admin/v1/roles`, {
      headers: { authorization: RBAC_TEST_TOKENS.noPermission },
    });

    expect(response.status).toBe(200);
  });

  it('denies inactive role because it resolves to no permissions', async () => {
    app = await createAppWithResolver({
      permissionKeys: [],
      roleKeys: [],
      isSuperAdmin: false,
    });

    const response = await fetch(`${await app.getUrl()}/admin/v1/roles`, {
      headers: { authorization: RBAC_TEST_TOKENS.inactiveRole },
    });

    expect(response.status).toBe(403);
  });

  it('denies expired user-role assignment because it resolves to no permissions', async () => {
    app = await createAppWithResolver({
      permissionKeys: [],
      roleKeys: [],
      isSuperAdmin: false,
    });

    const response = await fetch(`${await app.getUrl()}/admin/v1/roles`, {
      headers: { authorization: RBAC_TEST_TOKENS.expiredRole },
    });

    expect(response.status).toBe(403);
  });

  it('denies missing auth before permission resolution', async () => {
    app = await createAppWithResolver({
      permissionKeys: ['rbac.role.read'],
      roleKeys: ['admin'],
      isSuperAdmin: false,
    });

    const response = await fetch(`${await app.getUrl()}/admin/v1/roles`);

    expect(response.status).toBe(401);
  });
});
