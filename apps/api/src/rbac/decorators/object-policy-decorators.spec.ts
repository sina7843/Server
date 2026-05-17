import 'reflect-metadata';
import { RequireObjectPolicy } from './require-object-policy.decorator';
import { OBJECT_POLICY_METADATA_KEY } from './object-policy-metadata';

describe('RequireObjectPolicy decorator', () => {
  it('stores generic object policy metadata', () => {
    class TestController {
      @RequireObjectPolicy({
        requireOwnership: true,
        requiredPermission: 'content.post.update',
      })
      update(): void {}
    }

    const metadata = Reflect.getMetadata(
      OBJECT_POLICY_METADATA_KEY,
      TestController.prototype.update,
    );

    expect(metadata).toEqual({
      requireOwnership: true,
      requiredPermission: 'content.post.update',
    });
  });

  it('does not require domain-specific policy names', () => {
    class TestController {
      @RequireObjectPolicy({ requireOwnership: true })
      ownResource(): void {}
    }

    const metadata = Reflect.getMetadata(
      OBJECT_POLICY_METADATA_KEY,
      TestController.prototype.ownResource,
    );

    expect(metadata).not.toHaveProperty('postId');
    expect(metadata).not.toHaveProperty('teamId');
    expect(metadata).not.toHaveProperty('policyExpression');
  });
});
