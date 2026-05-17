import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, AuthContext } from './authenticated-request';

export const CurrentAuthContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.auth) {
      throw new Error('Authenticated request context is missing.');
    }

    return request.auth;
  },
);
