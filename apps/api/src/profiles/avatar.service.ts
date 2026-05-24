import { createHash } from 'node:crypto';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { MediaAssetRepository } from '../media/media-asset.repository';
import { generateObjectKey } from '../storage/storage-object-key';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.service';
import { UserProfileRepository } from './profile.repository';
import type { UserProfileDocument } from './profile.schema';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const AVATAR_ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ProfileAvatarData {
  readonly avatarUrl: string;
  readonly avatarVariants?: { readonly thumbnail?: string; readonly medium?: string };
}

@Injectable()
export class AvatarService {
  constructor(
    private readonly profileRepository: UserProfileRepository,
    private readonly mediaRepository: MediaAssetRepository,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
  ) {}

  async setAvatar(userId: string, rawMediaAssetId: string): Promise<UserProfileDocument> {
    if (!OBJECT_ID_PATTERN.test(rawMediaAssetId)) {
      throw new BadRequestException('mediaAssetId must be a valid ObjectId.');
    }

    const asset = await this.mediaRepository.findById(rawMediaAssetId);

    if (!asset || asset.deletedAt) {
      throw new BadRequestException('Media asset not found.');
    }
    if (!asset.mimeType.startsWith('image/')) {
      throw new BadRequestException('Media asset must be an image.');
    }
    if (asset.status !== 'ready' && asset.status !== 'uploaded') {
      throw new BadRequestException('Media asset is not ready for use.');
    }
    if (String(asset.uploadedBy) !== userId) {
      throw new ForbiddenException('You can only use your own media assets as avatar.');
    }
    if (asset.visibility !== 'public') {
      throw new BadRequestException('Avatar must be a public media asset.');
    }

    const profile = await this.profileRepository.updateProfile(userId, {
      avatarMediaId: rawMediaAssetId,
    });

    if (!profile) throw new BadRequestException('Profile does not exist.');

    return profile;
  }

  async uploadAndSetAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserProfileDocument> {
    if (!AVATAR_ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type. Allowed: JPEG, PNG, WebP, GIF.');
    }
    if (file.size > AVATAR_MAX_BYTES) {
      throw new BadRequestException('File exceeds the 5 MB avatar size limit.');
    }

    const objectKey = generateObjectKey({
      namespace: 'avatars',
      mimeType: file.mimetype,
    });

    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    const stored = await this.storageService.upload({
      objectKey,
      body: file.buffer,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      visibility: 'public',
      metadata: { uploadedBy: userId },
    });

    const safeOriginalName = (file.originalname ?? 'avatar')
      .replace(/[^\w.-]/g, '_')
      .replace(/\.{2,}/g, '_')
      .slice(0, 200);

    const dotIndex = safeOriginalName.lastIndexOf('.');
    const ext = dotIndex >= 0 ? safeOriginalName.slice(dotIndex + 1).toLowerCase() : 'jpg';

    const asset = await this.mediaRepository.create({
      originalName: safeOriginalName,
      fileName: objectKey.split('/').pop() ?? objectKey,
      mimeType: file.mimetype,
      extension: ext,
      sizeBytes: file.size,
      storageProvider: stored.provider,
      bucket: stored.bucket,
      objectKey,
      visibility: 'public',
      uploadedBy: userId,
      status: 'ready',
      checksum,
      variants: [],
    });

    const profile = await this.profileRepository.updateProfile(userId, {
      avatarMediaId: String(asset._id),
    });

    if (!profile) throw new BadRequestException('Profile does not exist.');

    return profile;
  }

  async deleteAvatar(userId: string): Promise<UserProfileDocument> {
    const profile = await this.profileRepository.updateProfile(userId, { avatarMediaId: null });

    if (!profile) throw new BadRequestException('Profile does not exist.');

    return profile;
  }

  async resolveAvatarUrls(
    avatarMediaId: string | undefined,
  ): Promise<ProfileAvatarData | undefined> {
    if (!avatarMediaId) return undefined;

    const asset = await this.mediaRepository.findById(avatarMediaId);

    if (!asset || asset.deletedAt || asset.visibility !== 'public') return undefined;

    const avatarUrl = this.storageService.getPublicUrl(asset.objectKey);
    const thumbnailVariant = asset.variants.find((v) => v.type === 'thumbnail');
    const mediumVariant = asset.variants.find((v) => v.type === 'medium');
    const avatarVariants: { thumbnail?: string; medium?: string } = {};

    if (thumbnailVariant) {
      avatarVariants.thumbnail = this.storageService.getPublicUrl(thumbnailVariant.objectKey);
    }
    if (mediumVariant) {
      avatarVariants.medium = this.storageService.getPublicUrl(mediumVariant.objectKey);
    }

    return {
      avatarUrl,
      ...(Object.keys(avatarVariants).length > 0 ? { avatarVariants } : {}),
    };
  }
}
