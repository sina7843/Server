/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import {
  type CanActivate,
  type ExecutionContext,
  type INestApplication,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { MeProfileController } from '../src/profiles/me-profile.controller';
import { UserProfileLifecycleService } from '../src/profiles/profile-lifecycle.service';
import { UserProfileService } from '../src/profiles/profile.service';

const myProfile = {
  username: 'dragon',
  displayName: 'Dragon',
  avatarMediaId: 'media-1',
  bio: 'My bio',
  visibility: 'public',
  publicUrl: '/u/dragon',
};

class TestAccessTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      authContext?: { userId: string; sessionId: string; accessTokenJti: string };
    }>();

    if (!request.headers.authorization) {
      throw new UnauthorizedException('Authentication is required.');
    }

    request.authContext = {
      userId: 'user-1',
      sessionId: 'session-1',
      accessTokenJti: 'jti-1',
    };

    return true;
  }
}

describe('authenticated profile API', () => {
  let app: INestApplication;
  const profileService = {
    getMyProfile: jest.fn(),
    updateMyProfile: jest.fn(),
  };
  const profileLifecycleService = {
    ensureProfileForVerifiedUser: jest.fn().mockResolvedValue({ _id: 'profile-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    profileService.getMyProfile.mockResolvedValue(myProfile);
    profileService.updateMyProfile.mockResolvedValue(myProfile);

    const moduleRef = await Test.createTestingModule({
      controllers: [MeProfileController],
      providers: [
        {
          provide: UserProfileService,
          useValue: profileService,
        },
        {
          provide: UserProfileLifecycleService,
          useValue: profileLifecycleService,
        },
        {
          provide: AccessTokenGuard,
          useClass: TestAccessTokenGuard,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/me/profile requires auth', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/me/profile`);

    expect(response.status).toBe(401);
  });

  it('GET /api/v1/me/profile returns safe own profile', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/me/profile`, {
      headers: { authorization: 'Bearer test-token' },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(myProfile);
    expect(JSON.stringify(body)).not.toContain('phone');
    expect(JSON.stringify(body)).not.toContain('email');
    expect(JSON.stringify(body)).not.toContain('passwordHash');
    expect(JSON.stringify(body)).not.toContain('token');
    expect(JSON.stringify(body)).not.toContain('session');
    expect(profileLifecycleService.ensureProfileForVerifiedUser).toHaveBeenCalledWith('user-1');
  });

  it('PATCH /api/v1/me/profile requires auth', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/me/profile`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Dragon Two' }),
    });

    expect(response.status).toBe(401);
  });

  it('PATCH /api/v1/me/profile rejects reserved username', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/me/profile`, {
      method: 'PATCH',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ username: 'admin' }),
    });

    expect(response.status).toBe(400);
    expect(profileService.updateMyProfile).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/me/profile rejects unsafe username', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/me/profile`, {
      method: 'PATCH',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ username: '../admin' }),
    });

    expect(response.status).toBe(400);
    expect(profileService.updateMyProfile).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/me/profile rejects duplicate username case-insensitively', async () => {
    profileService.updateMyProfile.mockRejectedValue(
      new ConflictException('Username is not available.'),
    );

    const response = await fetch(`${await app.getUrl()}/api/v1/me/profile`, {
      method: 'PATCH',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ username: 'Dragon' }),
    });

    expect(response.status).toBe(409);
  });

  it('PATCH /api/v1/me/profile strips sensitive fields through validation', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/me/profile`, {
      method: 'PATCH',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        displayName: 'Dragon Two',
        phone: '+989121234567',
        email: 'user@example.com',
        passwordHash: 'hash',
        token: 'token',
        session: {},
      }),
    });

    expect(response.status).toBe(400);
    expect(profileService.updateMyProfile).not.toHaveBeenCalled();
  });
});
