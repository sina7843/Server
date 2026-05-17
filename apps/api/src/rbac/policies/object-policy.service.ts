import { Injectable } from '@nestjs/common';
import type { PolicyContext } from './policy-context';
import { allowPolicyResult, denyPolicyResult, type PolicyResult } from './policy-result';
import type { BasicPolicyOptions } from './object-policy.types';

@Injectable()
export class ObjectPolicyService {
  canAccessOwnResource(context: PolicyContext): PolicyResult {
    if (!context.userId || !context.resourceOwnerId) {
      return denyPolicyResult('missing_context');
    }

    if (context.userId !== context.resourceOwnerId) {
      return denyPolicyResult('ownership_mismatch');
    }

    return allowPolicyResult();
  }

  hasPermission(context: PolicyContext, permissionKey: string): PolicyResult {
    if (!permissionKey || !context.permissionKeys) {
      return denyPolicyResult('missing_permission');
    }

    if (!context.permissionKeys.includes(permissionKey)) {
      return denyPolicyResult('missing_permission');
    }

    return allowPolicyResult();
  }

  evaluateBasicPolicy(context: PolicyContext, options: BasicPolicyOptions): PolicyResult {
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

      return permissionResult;
    }

    return denyPolicyResult('denied');
  }
}
