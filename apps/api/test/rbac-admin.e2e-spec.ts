/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { UserRepository } from '../src/auth/users/user.repository';
import { AdminPermissionsController } from '../src/rbac/controllers/admin-permissions.controller';
import { AdminRolesController } from '../src/rbac/controllers/admin-roles.controller';
import { AdminUserRolesController } from '../src/rbac/controllers/admin-user-roles.controller';
import { PermissionGuard } from '../src/rbac/guards/permission.guard';
import { PermissionService } from '../src/rbac/permissions/permission.service';
import { PermissionResolverService } from '../src/rbac/resolution/permission-resolver.service';
import { RolePermissionService } from '../src/rbac/role-permissions/role-permission.service';
import { RoleService } from '../src/rbac/roles/role.service';
import { UserRoleService } from '../src/rbac/user-roles/user-role.service';
import {
  createRbacPermissionDocument,
  createRbacPermissionResolverMock,
  createRbacRoleDocument,
  createRbacUserRoleDocument,
  RBAC_TEST_IDS,
  RBAC_TEST_TOKENS,
  RbacTestAccessTokenGuard,
} from './helpers/rbac-test.factory';

describe('RBAC admin API integration', () => {
  let app: INestApplication;
  let roleService: {
    list: jest.Mock;
    createAdminRole: jest.Mock;
    findById: jest.Mock;
    findMutableAdminRoleById: jest.Mock;
    updateAdminRole: jest.Mock;
    deactivateAdminRole: jest.Mock;
  };
  let permissionService: {
    listFiltered: jest.Mock;
    findById: jest.Mock;
  };
  let rolePermissionService: {
    attachPermission: jest.Mock;
    detachPermission: jest.Mock;
  };
  let userRepository: { findById: jest.Mock };
  let userRoleService: {
    assignRole: jest.Mock;
    removeUserRoleForUser: jest.Mock;
  };

  beforeEach(async () => {
    roleService = {
      list: jest.fn().mockResolvedValue([createRbacRoleDocument()]),
      createAdminRole: jest.fn().mockResolvedValue(createRbacRoleDocument()),
      findById: jest.fn().mockResolvedValue(createRbacRoleDocument()),
      findMutableAdminRoleById: jest.fn().mockResolvedValue(createRbacRoleDocument()),
      updateAdminRole: jest.fn().mockResolvedValue(createRbacRoleDocument()),
      deactivateAdminRole: jest.fn().mockResolvedValue(createRbacRoleDocument({ isActive: false })),
    };

    permissionService = {
      listFiltered: jest.fn().mockResolvedValue([createRbacPermissionDocument()]),
      findById: jest.fn().mockResolvedValue(createRbacPermissionDocument()),
    };

    rolePermissionService = {
      attachPermission: jest.fn().mockResolvedValue({ _id: 'mapping-1' }),
      detachPermission: jest.fn().mockResolvedValue({ _id: 'mapping-1' }),
    };

    userRepository = {
      findById: jest.fn().mockResolvedValue({
        _id: RBAC_TEST_IDS.normalUserId,
        status: 'active',
      }),
    };

    userRoleService = {
      assignRole: jest.fn().mockResolvedValue(createRbacUserRoleDocument()),
      removeUserRoleForUser: jest.fn().mockResolvedValue(createRbacUserRoleDocument()),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AdminRolesController, AdminPermissionsController, AdminUserRolesController],
      providers: [
        Reflector,
        PermissionGuard,
        {
          provide: PermissionResolverService,
          useValue: createRbacPermissionResolverMock(),
        },
        { provide: RoleService, useValue: roleService },
        { provide: PermissionService, useValue: permissionService },
        { provide: RolePermissionService, useValue: rolePermissionService },
        { provide: UserRepository, useValue: userRepository },
        { provide: UserRoleService, useValue: userRoleService },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useClass(RbacTestAccessTokenGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows super_admin to access protected RBAC admin APIs', async () => {
    const baseUrl = await app.getUrl();

    const responses = await Promise.all([
      fetch(`${baseUrl}/admin/v1/roles`, {
        headers: { authorization: RBAC_TEST_TOKENS.superAdmin },
      }),
      fetch(`${baseUrl}/admin/v1/permissions`, {
        headers: { authorization: RBAC_TEST_TOKENS.superAdmin },
      }),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
  });

  it('rejects missing auth as unauthorized', async () => {
    const response = await fetch(`${await app.getUrl()}/admin/v1/roles`);

    expect(response.status).toBe(401);
  });

  it('forbids a user without required permission', async () => {
    const response = await fetch(`${await app.getUrl()}/admin/v1/roles`, {
      headers: { authorization: RBAC_TEST_TOKENS.noPermission },
    });

    expect(response.status).toBe(403);
  });

  it('protects GET permissions and has no permission creation API', async () => {
    const protectedResponse = await fetch(`${await app.getUrl()}/admin/v1/permissions`, {
      headers: { authorization: RBAC_TEST_TOKENS.noPermission },
    });

    expect(protectedResponse.status).toBe(403);

    const missingRouteResponse = await fetch(`${await app.getUrl()}/admin/v1/permissions`, {
      method: 'POST',
      headers: {
        authorization: RBAC_TEST_TOKENS.superAdmin,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ key: 'rbac.permission.create' }),
    });

    expect(missingRouteResponse.status).toBe(404);
  });

  it('prevents system role deactivation through admin API', async () => {
    roleService.deactivateAdminRole.mockRejectedValueOnce(
      new ConflictException('System role cannot be deactivated.'),
    );

    const response = await fetch(
      `${await app.getUrl()}/admin/v1/roles/${RBAC_TEST_IDS.systemRoleId}`,
      {
        method: 'DELETE',
        headers: { authorization: RBAC_TEST_TOKENS.superAdmin },
      },
    );

    expect(response.status).toBe(409);
  });

  it('prevents attaching permissions to system roles', async () => {
    roleService.findMutableAdminRoleById.mockRejectedValueOnce(
      new ConflictException('System role permission mappings are seed-owned.'),
    );

    const response = await fetch(
      `${await app.getUrl()}/admin/v1/roles/${RBAC_TEST_IDS.systemRoleId}/permissions`,
      {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.superAdmin,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ permissionId: RBAC_TEST_IDS.permissionId }),
      },
    );

    expect(response.status).toBe(409);
    expect(rolePermissionService.attachPermission).not.toHaveBeenCalled();
  });

  it('prevents detaching permissions from system roles', async () => {
    roleService.findMutableAdminRoleById.mockRejectedValueOnce(
      new ConflictException('System role permission mappings are seed-owned.'),
    );

    const response = await fetch(
      `${await app.getUrl()}/admin/v1/roles/${RBAC_TEST_IDS.systemRoleId}/permissions/${RBAC_TEST_IDS.permissionId}`,
      {
        method: 'DELETE',
        headers: { authorization: RBAC_TEST_TOKENS.superAdmin },
      },
    );

    expect(response.status).toBe(409);
    expect(rolePermissionService.detachPermission).not.toHaveBeenCalled();
  });

  it('allows attaching and detaching permissions for custom non-system roles', async () => {
    const baseUrl = await app.getUrl();

    const attachResponse = await fetch(
      `${baseUrl}/admin/v1/roles/${RBAC_TEST_IDS.roleId}/permissions`,
      {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.superAdmin,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ permissionId: RBAC_TEST_IDS.permissionId }),
      },
    );
    const detachResponse = await fetch(
      `${baseUrl}/admin/v1/roles/${RBAC_TEST_IDS.roleId}/permissions/${RBAC_TEST_IDS.permissionId}`,
      {
        method: 'DELETE',
        headers: { authorization: RBAC_TEST_TOKENS.superAdmin },
      },
    );

    expect(attachResponse.status).toBe(201);
    expect(detachResponse.status).toBe(200);
    expect(rolePermissionService.attachPermission).toHaveBeenCalledWith({
      roleId: RBAC_TEST_IDS.roleId,
      permissionId: RBAC_TEST_IDS.permissionId,
    });
    expect(rolePermissionService.detachPermission).toHaveBeenCalledWith({
      roleId: RBAC_TEST_IDS.roleId,
      permissionId: RBAC_TEST_IDS.permissionId,
    });
  });

  it('validates assignable role before user-role assignment', async () => {
    roleService.findById.mockResolvedValueOnce(createRbacRoleDocument({ isAssignable: false }));

    const response = await fetch(
      `${await app.getUrl()}/admin/v1/users/${RBAC_TEST_IDS.normalUserId}/roles`,
      {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.superAdmin,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ roleId: RBAC_TEST_IDS.nonAssignableRoleId }),
      },
    );

    expect(response.status).toBe(404);
    expect(userRoleService.assignRole).not.toHaveBeenCalled();
  });
});
