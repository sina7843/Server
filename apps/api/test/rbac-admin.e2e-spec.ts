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
  let userRepository: {
    findById: jest.Mock;
  };
  let userRoleService: {
    assignRole: jest.Mock;
    removeUserRoleForUser: jest.Mock;
  };

  beforeEach(async () => {
    roleService = {
      list: jest.fn().mockResolvedValue([createRbacRoleDocument()]),
      createAdminRole: jest.fn().mockResolvedValue(createRbacRoleDocument()),
      findById: jest.fn().mockImplementation(async (roleId: string) => {
        if (roleId === RBAC_TEST_IDS.systemRoleId) {
          return createRbacRoleDocument({
            _id: RBAC_TEST_IDS.systemRoleId,
            key: 'super_admin',
            isSystem: true,
            isAssignable: false,
          });
        }

        if (roleId === RBAC_TEST_IDS.nonAssignableRoleId) {
          return createRbacRoleDocument({
            _id: RBAC_TEST_IDS.nonAssignableRoleId,
            key: 'system_locked',
            isAssignable: false,
          });
        }

        return createRbacRoleDocument({ _id: roleId });
      }),
      updateAdminRole: jest.fn().mockResolvedValue(createRbacRoleDocument()),
      deactivateAdminRole: jest.fn().mockResolvedValue(
        createRbacRoleDocument({
          isActive: false,
        }),
      ),
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
        {
          provide: RolePermissionService,
          useValue: rolePermissionService,
        },
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

    const requests: Array<Promise<Response>> = [
      fetch(`${baseUrl}/admin/v1/roles`, {
        headers: { authorization: RBAC_TEST_TOKENS.superAdmin },
      }),
      fetch(`${baseUrl}/admin/v1/roles`, {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.superAdmin,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          key: 'custom_admin',
          name: 'Custom Admin',
        }),
      }),
      fetch(`${baseUrl}/admin/v1/roles/${RBAC_TEST_IDS.roleId}`, {
        headers: { authorization: RBAC_TEST_TOKENS.superAdmin },
      }),
      fetch(`${baseUrl}/admin/v1/roles/${RBAC_TEST_IDS.roleId}`, {
        method: 'PATCH',
        headers: {
          authorization: RBAC_TEST_TOKENS.superAdmin,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated Custom Admin' }),
      }),
      fetch(`${baseUrl}/admin/v1/roles/${RBAC_TEST_IDS.roleId}`, {
        method: 'DELETE',
        headers: { authorization: RBAC_TEST_TOKENS.superAdmin },
      }),
      fetch(`${baseUrl}/admin/v1/permissions`, {
        headers: { authorization: RBAC_TEST_TOKENS.superAdmin },
      }),
      fetch(`${baseUrl}/admin/v1/roles/${RBAC_TEST_IDS.roleId}/permissions`, {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.superAdmin,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ permissionId: RBAC_TEST_IDS.permissionId }),
      }),
      fetch(
        `${baseUrl}/admin/v1/roles/${RBAC_TEST_IDS.roleId}/permissions/${RBAC_TEST_IDS.permissionId}`,
        {
          method: 'DELETE',
          headers: { authorization: RBAC_TEST_TOKENS.superAdmin },
        },
      ),
      fetch(`${baseUrl}/admin/v1/users/${RBAC_TEST_IDS.normalUserId}/roles`, {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.superAdmin,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ roleId: RBAC_TEST_IDS.roleId }),
      }),
      fetch(
        `${baseUrl}/admin/v1/users/${RBAC_TEST_IDS.normalUserId}/roles/${RBAC_TEST_IDS.userRoleId}`,
        {
          method: 'DELETE',
          headers: { authorization: RBAC_TEST_TOKENS.superAdmin },
        },
      ),
    ];

    const responses = await Promise.all(requests);

    expect(responses.map((response) => response.status)).toEqual([
      200, 201, 200, 200, 200, 200, 201, 200, 201, 200,
    ]);
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

  it('does not expose a permission creation API', async () => {
    const response = await fetch(`${await app.getUrl()}/admin/v1/permissions`, {
      method: 'POST',
      headers: {
        authorization: RBAC_TEST_TOKENS.superAdmin,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        key: 'content.secret.create',
        module: 'content',
        resource: 'secret',
        action: 'create',
      }),
    });

    expect(response.status).toBe(404);
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

  it('validates assignable role before user-role assignment', async () => {
    const response = await fetch(
      `${await app.getUrl()}/admin/v1/users/${RBAC_TEST_IDS.normalUserId}/roles`,
      {
        method: 'POST',
        headers: {
          authorization: RBAC_TEST_TOKENS.superAdmin,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          roleId: RBAC_TEST_IDS.nonAssignableRoleId,
        }),
      },
    );

    expect(response.status).toBe(404);
    expect(userRoleService.assignRole).not.toHaveBeenCalled();
  });
});
