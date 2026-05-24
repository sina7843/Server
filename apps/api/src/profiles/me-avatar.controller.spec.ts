import { BadRequestException } from '@nestjs/common';
import { MeAvatarController } from './me-avatar.controller';

const auth = { userId: 'user-1', sessionId: 'session-1', accessTokenJti: 'jti' };

const profileDoc = {
  username: 'dragon',
  displayName: 'Dragon',
  avatarMediaId: { toString: () => 'asset-id' },
  visibility: 'public',
  publicUrl: '/u/dragon',
  bio: undefined,
};

function makeController(avatarService: Record<string, jest.Mock>) {
  return new MeAvatarController(avatarService as never);
}

describe('MeAvatarController.setAvatar', () => {
  it('sets avatar and returns enriched profile DTO', async () => {
    const setAvatar = jest.fn().mockResolvedValue(profileDoc);
    const resolveAvatarUrls = jest.fn().mockResolvedValue({
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
    });
    const controller = makeController({ setAvatar, resolveAvatarUrls });

    const result = await controller.setAvatar(auth, { mediaAssetId: 'asset-id' });

    expect(setAvatar).toHaveBeenCalledWith('user-1', 'asset-id');
    expect(result).toMatchObject({
      username: 'dragon',
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
    });
  });

  it('rejects when mediaAssetId is missing', async () => {
    const controller = makeController({ setAvatar: jest.fn(), resolveAvatarUrls: jest.fn() });
    await expect(controller.setAvatar(auth, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when mediaAssetId is not a string', async () => {
    const controller = makeController({ setAvatar: jest.fn(), resolveAvatarUrls: jest.fn() });
    await expect(controller.setAvatar(auth, { mediaAssetId: 123 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('MeAvatarController.deleteAvatar', () => {
  it('deletes avatar and returns profile DTO', async () => {
    const deleteAvatar = jest.fn().mockResolvedValue({ ...profileDoc, avatarMediaId: undefined });
    const resolveAvatarUrls = jest.fn().mockResolvedValue(undefined);
    const controller = makeController({ deleteAvatar, resolveAvatarUrls });

    const result = await controller.deleteAvatar(auth);

    expect(deleteAvatar).toHaveBeenCalledWith('user-1');
    expect(result).not.toHaveProperty('avatarUrl');
  });
});

describe('MeAvatarController.uploadAvatar', () => {
  it('throws when no file is provided', async () => {
    const controller = makeController({
      uploadAndSetAvatar: jest.fn(),
      resolveAvatarUrls: jest.fn(),
    });
    await expect(controller.uploadAvatar(auth, undefined as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('uploads file and returns enriched profile DTO', async () => {
    const mockFile = {
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('data'),
    } as Express.Multer.File;

    const uploadAndSetAvatar = jest.fn().mockResolvedValue(profileDoc);
    const resolveAvatarUrls = jest.fn().mockResolvedValue({
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
    });
    const controller = makeController({ uploadAndSetAvatar, resolveAvatarUrls });

    const result = await controller.uploadAvatar(auth, mockFile);

    expect(uploadAndSetAvatar).toHaveBeenCalledWith('user-1', mockFile);
    expect(result).toMatchObject({ avatarUrl: 'https://cdn.example.com/avatar.jpg' });
  });
});
