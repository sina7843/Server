import { ObjectPolicyService } from './object-policy.service';

describe('ObjectPolicyService', () => {
  const service = new ObjectPolicyService();

  it('allows own-resource check when userId equals resourceOwnerId', () => {
    expect(
      service.canAccessOwnResource({
        userId: 'user-1',
        resourceOwnerId: 'user-1',
      }),
    ).toEqual({ allowed: true, reason: 'allowed' });
  });

  it('denies own-resource check when userId differs', () => {
    expect(
      service.canAccessOwnResource({
        userId: 'user-1',
        resourceOwnerId: 'user-2',
      }),
    ).toEqual({ allowed: false, reason: 'ownership_mismatch' });
  });

  it('denies own-resource check when context is missing', () => {
    expect(
      service.canAccessOwnResource({
        userId: 'user-1',
      }),
    ).toEqual({ allowed: false, reason: 'missing_context' });
  });

  it('allows permission-based check when permission exists in context', () => {
    expect(
      service.hasPermission(
        { userId: 'user-1', permissionKeys: ['content.post.update'] },
        'content.post.update',
      ),
    ).toEqual({ allowed: true, reason: 'allowed' });
  });

  it('denies permission-based check when permission is missing', () => {
    expect(
      service.hasPermission({ userId: 'user-1', permissionKeys: [] }, 'content.post.update'),
    ).toEqual({ allowed: false, reason: 'missing_permission' });
  });

  it('evaluateBasicPolicy denies by default', () => {
    expect(service.evaluateBasicPolicy({ userId: 'user-1' }, {})).toEqual({
      allowed: false,
      reason: 'denied',
    });
  });

  it('evaluateBasicPolicy supports ownership option', () => {
    expect(
      service.evaluateBasicPolicy(
        { userId: 'user-1', resourceOwnerId: 'user-1' },
        { requireOwnership: true },
      ),
    ).toEqual({ allowed: true, reason: 'allowed' });
  });

  it('evaluateBasicPolicy supports requiredPermission option', () => {
    expect(
      service.evaluateBasicPolicy(
        { userId: 'user-1', permissionKeys: ['rbac.role.read'] },
        { requiredPermission: 'rbac.role.read' },
      ),
    ).toEqual({ allowed: true, reason: 'allowed' });
  });

  it('supports own-profile update foundation', () => {
    expect(service.canUpdateOwnProfile('user-1', 'user-1')).toBe(true);
    expect(service.canUpdateOwnProfile('user-1', 'user-2')).toBe(false);
  });

  it('does not require MongoDB or load domain resources', () => {
    expect(service).toBeInstanceOf(ObjectPolicyService);
  });
});
