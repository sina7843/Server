import { ObjectPolicyService } from './object-policy.service';

describe('ObjectPolicyService', () => {
  let service: ObjectPolicyService;

  beforeEach(() => {
    service = new ObjectPolicyService();
  });

  it('allows own-resource access when userId equals resourceOwnerId', () => {
    expect(
      service.canAccessOwnResource({
        userId: 'user-1',
        resourceOwnerId: 'user-1',
      }),
    ).toEqual({ allowed: true, reason: 'allowed' });
  });

  it('denies own-resource access when userId differs', () => {
    expect(
      service.canAccessOwnResource({
        userId: 'user-1',
        resourceOwnerId: 'user-2',
      }),
    ).toEqual({ allowed: false, reason: 'ownership_mismatch' });
  });

  it('denies own-resource access when context is missing', () => {
    expect(service.canAccessOwnResource({ userId: 'user-1' })).toEqual({
      allowed: false,
      reason: 'missing_context',
    });
  });

  it('allows permission-based access when permission exists in context', () => {
    expect(
      service.hasPermission(
        { userId: 'user-1', permissionKeys: ['content.post.update'] },
        'content.post.update',
      ),
    ).toEqual({ allowed: true, reason: 'allowed' });
  });

  it('denies permission-based access when permission is missing', () => {
    expect(
      service.hasPermission(
        { userId: 'user-1', permissionKeys: ['content.post.read'] },
        'content.post.update',
      ),
    ).toEqual({ allowed: false, reason: 'missing_permission' });
  });

  it('denies by default when no policy option is provided', () => {
    expect(service.evaluateBasicPolicy({ userId: 'user-1' }, {})).toEqual({
      allowed: false,
      reason: 'denied',
    });
  });

  it('supports ownership option', () => {
    expect(
      service.evaluateBasicPolicy(
        { userId: 'user-1', resourceOwnerId: 'user-1' },
        { requireOwnership: true },
      ),
    ).toEqual({ allowed: true, reason: 'allowed' });
  });

  it('supports requiredPermission option', () => {
    expect(
      service.evaluateBasicPolicy(
        { userId: 'user-1', permissionKeys: ['rbac.role.read'] },
        { requiredPermission: 'rbac.role.read' },
      ),
    ).toEqual({ allowed: true, reason: 'allowed' });
  });

  it('does not require MongoDB or load domain resources', () => {
    expect(service).toBeInstanceOf(ObjectPolicyService);
    expect(
      service.evaluateBasicPolicy(
        {
          userId: 'user-1',
          scopeType: 'future-domain',
          scopeId: 'scope-1',
          resource: { opaque: true },
        },
        {},
      ),
    ).toEqual({ allowed: false, reason: 'denied' });
  });
});
