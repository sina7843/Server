import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AvatarService } from './avatar.service';

const mockStorageService = {
  upload: jest.fn(),
  getPublicUrl: jest.fn((key: string) => `https://cdn.example.com/${key}`),
  getSignedUrl: jest.fn(),
  download: jest.fn(),
  delete: jest.fn(),
};

const imageAsset = {
  _id: 'asset-id',
  objectKey: 'avatars/2026/01/abc.jpg',
  mimeType: 'image/jpeg',
  status: 'ready',
  visibility: 'public',
  uploadedBy: { toString: () => 'user-1' },
  variants: [],
};

const mockMediaRepository = {
  findById: jest.fn(),
  create: jest.fn(),
};

const mockProfileRepository = {
  updateProfile: jest.fn(),
};

const mockPipeline = {
  upload: jest.fn(),
  reprocessVariants: jest.fn(),
};

function makeService() {
  return new AvatarService(
    mockProfileRepository as never,
    mockMediaRepository as never,
    mockStorageService as never,
    mockPipeline as never,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AvatarService.setAvatar', () => {
  it('sets avatar and returns updated profile', async () => {
    mockMediaRepository.findById.mockResolvedValue(imageAsset);
    mockProfileRepository.updateProfile.mockResolvedValue({
      _id: 'profile',
      avatarMediaId: 'asset-id',
    });

    const service = makeService();
    const result = await service.setAvatar('user-1', 'a'.repeat(24));

    expect(mockProfileRepository.updateProfile).toHaveBeenCalledWith('user-1', {
      avatarMediaId: 'a'.repeat(24),
    });
    expect(result).toHaveProperty('avatarMediaId');
  });

  it('rejects invalid ObjectId', async () => {
    const service = makeService();
    await expect(service.setAvatar('user-1', 'not-an-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects non-existent asset', async () => {
    mockMediaRepository.findById.mockResolvedValue(null);
    const service = makeService();
    await expect(service.setAvatar('user-1', 'a'.repeat(24))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects deleted asset', async () => {
    mockMediaRepository.findById.mockResolvedValue({ ...imageAsset, deletedAt: new Date() });
    const service = makeService();
    await expect(service.setAvatar('user-1', 'a'.repeat(24))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects non-image asset', async () => {
    mockMediaRepository.findById.mockResolvedValue({ ...imageAsset, mimeType: 'application/pdf' });
    const service = makeService();
    await expect(service.setAvatar('user-1', 'a'.repeat(24))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects asset with processing status', async () => {
    mockMediaRepository.findById.mockResolvedValue({ ...imageAsset, status: 'processing' });
    const service = makeService();
    await expect(service.setAvatar('user-1', 'a'.repeat(24))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects asset owned by different user', async () => {
    mockMediaRepository.findById.mockResolvedValue({
      ...imageAsset,
      uploadedBy: { toString: () => 'user-2' },
    });
    const service = makeService();
    await expect(service.setAvatar('user-1', 'a'.repeat(24))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects private asset', async () => {
    mockMediaRepository.findById.mockResolvedValue({ ...imageAsset, visibility: 'private' });
    const service = makeService();
    await expect(service.setAvatar('user-1', 'a'.repeat(24))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('AvatarService.uploadAndSetAvatar', () => {
  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'avatar.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
    size: 16,
  } as Express.Multer.File;

  it('calls pipeline.upload with correct arguments', async () => {
    const createdAsset = { ...imageAsset, _id: 'new-asset-id' };
    mockPipeline.upload.mockResolvedValue(createdAsset);
    mockProfileRepository.updateProfile.mockResolvedValue({ _id: 'profile' });

    const service = makeService();
    await service.uploadAndSetAvatar('user-1', mockFile);

    expect(mockPipeline.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.objectContaining({
          buffer: mockFile.buffer,
          mimetype: mockFile.mimetype,
          originalname: mockFile.originalname,
          size: mockFile.size,
        }),
        uploadedBy: 'user-1',
        visibility: 'public',
        namespace: 'avatars',
      }),
    );
  });

  it('sets avatarMediaId to the created asset id', async () => {
    const createdAsset = { ...imageAsset, _id: 'new-asset-id' };
    mockPipeline.upload.mockResolvedValue(createdAsset);
    mockProfileRepository.updateProfile.mockResolvedValue({ _id: 'profile' });

    const service = makeService();
    await service.uploadAndSetAvatar('user-1', mockFile);

    expect(mockProfileRepository.updateProfile).toHaveBeenCalledWith('user-1', {
      avatarMediaId: 'new-asset-id',
    });
  });

  it('propagates BadRequestException from pipeline for invalid content', async () => {
    mockPipeline.upload.mockRejectedValue(
      new BadRequestException('File content does not match declared type'),
    );

    const service = makeService();
    await expect(service.uploadAndSetAvatar('user-1', mockFile)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mockProfileRepository.updateProfile).not.toHaveBeenCalled();
  });

  it('does not call storageService.upload directly', async () => {
    const createdAsset = { ...imageAsset, _id: 'new-asset-id' };
    mockPipeline.upload.mockResolvedValue(createdAsset);
    mockProfileRepository.updateProfile.mockResolvedValue({ _id: 'profile' });

    const service = makeService();
    await service.uploadAndSetAvatar('user-1', mockFile);

    expect(mockStorageService.upload).not.toHaveBeenCalled();
  });

  it('throws if profile does not exist after asset creation', async () => {
    mockPipeline.upload.mockResolvedValue({ ...imageAsset, _id: 'new-asset-id' });
    mockProfileRepository.updateProfile.mockResolvedValue(null);

    const service = makeService();
    await expect(service.uploadAndSetAvatar('user-1', mockFile)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('AvatarService.deleteAvatar', () => {
  it('clears avatarMediaId and returns updated profile', async () => {
    mockProfileRepository.updateProfile.mockResolvedValue({ _id: 'profile' });
    const service = makeService();
    await service.deleteAvatar('user-1');
    expect(mockProfileRepository.updateProfile).toHaveBeenCalledWith('user-1', {
      avatarMediaId: null,
    });
  });

  it('throws if profile does not exist', async () => {
    mockProfileRepository.updateProfile.mockResolvedValue(null);
    const service = makeService();
    await expect(service.deleteAvatar('user-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('AvatarService.resolveAvatarUrls', () => {
  it('returns undefined when avatarMediaId is undefined', async () => {
    const service = makeService();
    await expect(service.resolveAvatarUrls(undefined)).resolves.toBeUndefined();
    expect(mockMediaRepository.findById).not.toHaveBeenCalled();
  });

  it('returns undefined when asset not found', async () => {
    mockMediaRepository.findById.mockResolvedValue(null);
    const service = makeService();
    await expect(service.resolveAvatarUrls('asset-id')).resolves.toBeUndefined();
  });

  it('returns undefined for private asset (does not leak URL)', async () => {
    mockMediaRepository.findById.mockResolvedValue({ ...imageAsset, visibility: 'private' });
    const service = makeService();
    await expect(service.resolveAvatarUrls('asset-id')).resolves.toBeUndefined();
  });

  it('returns avatarUrl for public asset', async () => {
    mockMediaRepository.findById.mockResolvedValue(imageAsset);
    const service = makeService();
    const result = await service.resolveAvatarUrls('asset-id');
    expect(result?.avatarUrl).toBe(`https://cdn.example.com/${imageAsset.objectKey}`);
  });

  it('includes variant URLs when variants exist', async () => {
    const assetWithVariants = {
      ...imageAsset,
      variants: [
        { type: 'thumbnail', objectKey: 'avatars/thumb/abc.jpg' },
        { type: 'medium', objectKey: 'avatars/medium/abc.jpg' },
      ],
    };
    mockMediaRepository.findById.mockResolvedValue(assetWithVariants);
    const service = makeService();
    const result = await service.resolveAvatarUrls('asset-id');

    expect(result?.avatarVariants?.thumbnail).toBe('https://cdn.example.com/avatars/thumb/abc.jpg');
    expect(result?.avatarVariants?.medium).toBe('https://cdn.example.com/avatars/medium/abc.jpg');
  });
});
