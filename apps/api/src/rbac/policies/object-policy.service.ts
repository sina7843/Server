import { Injectable } from '@nestjs/common';
import type { PolicyContext } from './policy-context';
import type { PolicyResult } from './policy-result';

@Injectable()
export class ObjectPolicyService {
  canAccessOwnResource(context: PolicyContext): PolicyResult {
    if (!context.userId || !context.resourceOwnerId) {
      return { allowed: false, reason: 'missing_context' };
    }

    if (context.userId !== context.resourceOwnerId) {
      return { allowed: false, reason: 'ownership_mismatch' };
    }

    return { allowed: true, reason: 'allowed' };
  }

  hasPermission(context: PolicyContext, permissionKey: string): PolicyResult {
    if (!permissionKey || !context.permissionKeys) {
      return { allowed: false, reason: 'missing_context' };
    }

    if (!context.permissionKeys.includes(permissionKey)) {
      return { allowed: false, reason: 'missing_permission' };
    }

    return { allowed: true, reason: 'allowed' };
  }

  evaluateBasicPolicy(
    context: PolicyContext,
    options: {
      readonly requireOwnership?: boolean;
      readonly requiredPermission?: string;
    },
  ): PolicyResult {
    if (options.requireOwnership) {
      const ownershipResult = this.canAccessOwnResource(context);

      if (ownershipResult.allowed) {
        return ownershipResult;
      }
    }

    if (options.requiredPermission) {
      const permissionResult = this.hasPermission(context, options.requiredPermission);

      if (permissionResult.allowed) {
        return permissionResult;
      }
    }

    return { allowed: false, reason: 'denied' };
  }

  canUpdateOwnProfile(authUserId: string, profileUserId: string): boolean {
    return this.canAccessOwnResource({
      userId: authUserId,
      resourceOwnerId: profileUserId,
      resourceType: 'user_profile',
    }).allowed;
  }
}
