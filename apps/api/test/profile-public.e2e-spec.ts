/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AvatarService } from '../src/profiles/avatar.service';
import { ProfileController } from '../src/profiles/profile.controller';
import { UserProfileService } from '../src/profiles/profile.service';

const publicProfile = {
  username: 'dragon',
  displayName: 'Dragon',
  avatarMediaId: 'media-1',
  avatarUrl: null,
  thumbnailUrl: null,
  bio: 'Public bio',
  visibility: 'public',
  publicUrl: '/u/dragon',
};

describe('GET /api/v1/u/:username', () => {
  let app: INestApplication;
  const profileService = {
    getPublicProfileByUsername: jest.fn(),
  };
  const avatarService = {
    resolveAvatarUrls: jest.fn().mockResolvedValue({ avatarUrl: null, thumbnailUrl: null }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    avatarService.resolveAvatarUrls.mockResolvedValue({ avatarUrl: null, thumbnailUrl: null });

    const moduleRef = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: UserProfileService,
          useValue: profileService,
        },
        {
          provide: AvatarService,
          useValue: avatarService,
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

  it('returns public profile for active public user', async () => {
    profileService.getPublicProfileByUsername.mockResolvedValue(publicProfile);

    const response = await fetch(`${await app.getUrl()}/api/v1/u/Dragon`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(publicProfile);
    expect(profileService.getPublicProfileByUsername).toHaveBeenCalledWith('Dragon');
  });

  it('returns safe private state without hidden profile fields', async () => {
    profileService.getPublicProfileByUsername.mockResolvedValue({ state: 'private' });

    const response = await fetch(`${await app.getUrl()}/api/v1/u/private-user`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ state: 'private' });
    expect(body).not.toHaveProperty('displayName');
    expect(body).not.toHaveProperty('bio');
    expect(body).not.toHaveProperty('avatarMediaId');
  });

  it.each([
    ['pending-user', { state: 'private' }],
    ['suspended-user', { state: 'private' }],
    ['banned-user', { state: 'not_found' }],
    ['deleted-user', { state: 'not_found' }],
  ])('does not expose meaningful public data for %s', async (username, state) => {
    profileService.getPublicProfileByUsername.mockResolvedValue(state);

    const response = await fetch(`${await app.getUrl()}/api/v1/u/${username}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(state);
    expect(JSON.stringify(body)).not.toContain('phone');
    expect(JSON.stringify(body)).not.toContain('email');
    expect(JSON.stringify(body)).not.toContain('passwordHash');
    expect(JSON.stringify(body)).not.toContain('token');
    expect(JSON.stringify(body)).not.toContain('session');
  });

  it('does not expose sensitive fields in public response', async () => {
    profileService.getPublicProfileByUsername.mockResolvedValue(publicProfile);

    const response = await fetch(`${await app.getUrl()}/api/v1/u/dragon`);
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('phone');
    expect(serialized).not.toContain('email');
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('token');
    expect(serialized).not.toContain('session');
  });
});
