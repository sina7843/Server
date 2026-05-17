import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  OBJECT_POLICY_METADATA_KEY,
  type RequireObjectPolicyMetadata,
} from '../decorators/object-policy-metadata';
import type { PolicyContext } from '../policies/policy-context';
import { ObjectPolicyService } from '../policies/object-policy.service';
import type { RequestWithPolicyContext } from '../policies/object-policy.types';

@Injectable()
export class ObjectPolicyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly objectPolicyService: ObjectPolicyService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.getAllAndOverride<RequireObjectPolicyMetadata | undefined>(
      OBJECT_POLICY_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) {
      throw new ForbiddenException('Object policy is required.');
    }

    const request = context.switchToHttp().getRequest<RequestWithPolicyContext>();

    const policyContext = this.buildPolicyContext(request, metadata.contextKey);
    const result = this.objectPolicyService.evaluateBasicPolicy(policyContext, metadata);

    if (!result.allowed) {
      throw new ForbiddenException('Access denied.');
    }

    return true;
  }

  private buildPolicyContext(
    request: RequestWithPolicyContext,
    contextKey?: string,
  ): PolicyContext {
    const explicitContext =
      contextKey && typeof request[contextKey] === 'object'
        ? (request[contextKey] as Partial<PolicyContext>)
        : request.policyContext;

    return {
      ...(explicitContext ?? {}),
      ...(request.auth?.userId ? { userId: request.auth.userId } : {}),
    };
  }
}
