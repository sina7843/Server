/* global describe, expect, it, jest */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AccessTokenGuard } from './access-token.guard';
import { SessionRepository } from '../sessions/session.repository';
import { SessionService } from '../sessions/session.service';
import { AccessTokenService } from '../tokens/access-token.service';
import { UserRepository } from '../users/user.repository';
import { UserService } from '../users/user.service';
import type { AuthenticatedRequest } from './authenticated-request';

function createExecutionContext(request: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('AccessTokenGuard', () => {
  function createGuard() {
    const accessTokenService = {
      verifyAccessToken: jest.fn().mockReturnValue({
        sub: 'user-1',
        jti: 'access-jti-1',
        sessionId: 'session-1',
      }),
    } as unknown as jest.Mocked<AccessTokenService>;
    const userRepository = {
      findById: jest.fn().mockResolvedValue({
        _id: 'user-1',
        status: 'active',
        phoneVerifiedAt: new Date(),
        failedLoginCount: 0,
      }),
    } as unknown as jest.Mocked<UserRepository>;
    const sessionRepository = {
      findActiveById: jest.fn().mockResolvedValue({
        _id: 'session-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 60_000),
        accessTokenJti: 'access-jti-1',
      }),
    } as unknown as jest.Mocked<SessionRepository>;
    const guard = new AccessTokenGuard(
      accessTokenService,
      userRepository,
      new UserService(),
      sessionRepository,
      new SessionService(),
    );

    return {
      accessTokenService,
      guard,
      sessionRepository,
      userRepository,
    };
  }

  it('accepts a valid access token and attaches minimal auth context', async () => {
    const { guard } = createGuard();
    const request: AuthenticatedRequest = {
      headers: { authorization: 'Bearer access-token' },
    };

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(true);

    expect(request.auth).toEqual({
      userId: 'user-1',
      sessionId: 'session-1',
      accessTokenJti: 'access-jti-1',
    });
  });

  it('rejects missing tokens', async () => {
    const { guard } = createGuard();

    await expect(guard.canActivate(createExecutionContext({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects malformed authorization headers', async () => {
    const { guard } = createGuard();

    await expect(
      guard.canActivate(createExecutionContext({ headers: { authorization: 'Token invalid' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects invalid or expired tokens', async () => {
    const { accessTokenService, guard } = createGuard();
    accessTokenService.verifyAccessToken.mockImplementation(() => {
      throw new UnauthorizedException('Invalid access token.');
    });

    await expect(
      guard.canActivate(createExecutionContext({ headers: { authorization: 'Bearer invalid' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each(['pending_verification', 'suspended', 'banned', 'deleted'] as const)(
    'rejects %s users safely',
    async (status) => {
      const { guard, userRepository } = createGuard();
      userRepository.findById.mockResolvedValue({
        _id: 'user-1',
        status,
        failedLoginCount: 0,
      } as never);

      await expect(
        guard.canActivate(
          createExecutionContext({ headers: { authorization: 'Bearer access-token' } }),
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    },
  );

  it('rejects revoked or missing sessions', async () => {
    const { guard, sessionRepository } = createGuard();
    sessionRepository.findActiveById.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        createExecutionContext({ headers: { authorization: 'Bearer access-token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects tokens whose jti does not match the active session jti', async () => {
    const { guard, sessionRepository } = createGuard();
    sessionRepository.findActiveById.mockResolvedValue({
      _id: 'session-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
      accessTokenJti: 'different-jti',
    } as never);

    await expect(
      guard.canActivate(
        createExecutionContext({ headers: { authorization: 'Bearer access-token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects sessions without a persisted access token jti', async () => {
    const { guard, sessionRepository } = createGuard();
    sessionRepository.findActiveById.mockResolvedValue({
      _id: 'session-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
    } as never);

    await expect(
      guard.canActivate(
        createExecutionContext({ headers: { authorization: 'Bearer access-token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
