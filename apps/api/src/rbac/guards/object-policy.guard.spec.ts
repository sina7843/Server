import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ObjectPolicyGuard } from './object-policy.guard';
import { ObjectPolicyService } from '../policies/object-policy.service';
import type { RequestWithPolicyContext } from '../policies/object-policy.types';

function createExecutionContext(request: RequestWithPolicyContext) {
  class TestController {}
  const handler = () => undefined;

  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as never;
}

describe('ObjectPolicyGuard', () => {
  let reflector: Reflector;
  let service: ObjectPolicyService;
  let guard: ObjectPolicyGuard;

  beforeEach(() => {
    reflector = new Reflector();
    service = new ObjectPolicyService();
    guard = new ObjectPolicyGuard(reflector, service);
  });

  it('delegates to ObjectPolicyService', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
      requireOwnership: true,
    });

    const serviceSpy = jest.spyOn(service, 'evaluateBasicPolicy');

    expect(
      guard.canActivate(
        createExecutionContext({
          auth: { userId: 'user-1' },
          policyContext: { resourceOwnerId: 'user-1' },
        }),
      ),
    ).toBe(true);

    expect(serviceSpy).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        resourceOwnerId: 'user-1',
      },
      { requireOwnership: true },
    );
  });

  it('denies missing metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(() => guard.canActivate(createExecutionContext({ auth: { userId: 'user-1' } }))).toThrow(
      ForbiddenException,
    );
  });

  it('denies missing auth or policy context', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
      requireOwnership: true,
    });

    expect(() => guard.canActivate(createExecutionContext({}))).toThrow(ForbiddenException);
  });

  it('uses custom contextKey without loading domain resources', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
      contextKey: 'objectPolicyContext',
      requiredPermission: 'media.asset.update',
    });

    expect(
      guard.canActivate(
        createExecutionContext({
          auth: { userId: 'user-1' },
          objectPolicyContext: {
            permissionKeys: ['media.asset.update'],
            resourceId: 'asset-1',
            resourceType: 'media.asset',
          },
        }),
      ),
    ).toBe(true);
  });

  it('does not bypass PermissionGuard or add RBAC checks', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
      requiredPermission: 'rbac.role.update',
    });

    expect(() =>
      guard.canActivate(
        createExecutionContext({
          auth: { userId: 'user-1' },
          policyContext: { permissionKeys: [] },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
