import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { AuditAction } from '@dragon/types';
import { AuditService } from '../audit/audit.service';
import { MediaAssetRepository } from '../media/media-asset.repository';
import { MediaUploadPipeline } from '../media/media-upload-pipeline.service';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.service';
import { UserProfileRepository } from './profile.repository';
import type { UserProfileDocument } from './profile.schema';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

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
    private readonly pipeline: MediaUploadPipeline,
    @Optional() private readonly auditService?: AuditService,
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

    void this.auditService?.log({
      actorId: userId,
      actorType: 'user',
      action: AuditAction.MEDIA_AVATAR_UPDATED,
      resourceType: 'media_asset',
      resourceId: rawMediaAssetId,
      metadata: { userId },
      severity: 'info',
    });

    return profile;
  }

  async uploadAndSetAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserProfileDocument> {
    const asset = await this.pipeline.upload({
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
      uploadedBy: userId,
      visibility: 'public',
      namespace: 'avatars',
    });

    const profile = await this.profileRepository.updateProfile(userId, {
      avatarMediaId: String(asset._id),
    });

    if (!profile) throw new BadRequestException('Profile does not exist.');

    void this.auditService?.log({
      actorId: userId,
      actorType: 'user',
      action: AuditAction.MEDIA_AVATAR_UPDATED,
      resourceType: 'media_asset',
      resourceId: String(asset._id),
      metadata: { userId },
      severity: 'info',
    });

    return profile;
  }

  async deleteAvatar(userId: string): Promise<UserProfileDocument> {
    const profile = await this.profileRepository.updateProfile(userId, { avatarMediaId: null });

    if (!profile) throw new BadRequestException('Profile does not exist.');

    void this.auditService?.log({
      actorId: userId,
      actorType: 'user',
      action: AuditAction.MEDIA_AVATAR_DELETED,
      resourceType: 'profile',
      resourceId: userId,
      severity: 'info',
    });

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
