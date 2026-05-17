import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionRepository } from '../sessions/session.repository';
import { SessionService } from '../sessions/session.service';
import { AccessTokenService } from '../tokens/access-token.service';
import { UserRepository } from '../users/user.repository';
import { UserService } from '../users/user.service';
import type { AuthenticatedRequest } from './authenticated-request';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = extractBearerToken(request);

    if (!accessToken) {
      throw createUnauthorizedError();
    }

    const claims = verifyTokenSafely(this.accessTokenService, accessToken);

    if (!claims.sessionId) {
      throw createUnauthorizedError();
    }

    const [user, session] = await Promise.all([
      this.userRepository.findById(claims.sub),
      this.sessionRepository.findActiveById(claims.sessionId),
    ]);

    if (!user || !this.userService.canAttemptLogin(user)) {
      throw createUnauthorizedError();
    }

    if (!session || !this.sessionService.canUseSession(session)) {
      throw createUnauthorizedError();
    }

    if (String(session.userId) !== claims.sub) {
      throw createUnauthorizedError();
    }

    request.auth = {
      userId: claims.sub,
      sessionId: claims.sessionId,
      accessTokenJti: claims.jti,
    };

    return true;
  }
}

function verifyTokenSafely(accessTokenService: AccessTokenService, accessToken: string) {
  try {
    return accessTokenService.verifyAccessToken(accessToken);
  } catch {
    throw createUnauthorizedError();
  }
}

function extractBearerToken(request: AuthenticatedRequest): string | null {
  const authorization = request.headers?.authorization;

  if (typeof authorization !== 'string' || !authorization.startsWith(BEARER_PREFIX)) {
    return null;
  }

  const token = authorization.slice(BEARER_PREFIX.length).trim();

  return token.length > 0 ? token : null;
}

function createUnauthorizedError(): UnauthorizedException {
  return new UnauthorizedException('Authentication is required.');
}
