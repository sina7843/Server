import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Optional,
} from '@nestjs/common';
import { AuditAction } from '@dragon/types';
import { AuditService } from '../audit/audit.service';
import { Types } from 'mongoose';
import { UserRepository } from '../auth/users/user.repository';
import type { MyUserProfileDto } from './dto/my-profile-response.dto';
import type { PublicProfileResponseDto } from './dto/public-profile-response.dto';
import { createPrivateProfileState, createProfileNotFoundState } from './dto/profile-response.dto';
import type { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { toMyUserProfileDto, toPublicUserProfileDto } from './profile.mapper';
import { UserProfileRepository } from './profile.repository';
import type { UserProfileDocument } from './profile.schema';
import {
  PROFILE_VISIBILITIES,
  type CreateUserProfileInput,
  type ProfileVisibility,
  type UpdateUserProfileInput,
} from './profile.types';
import { UserProfileVisibilityService } from './profile-visibility.service';
import { UsernamePolicyError, validateUsernamePolicy } from './username/username-policy';

const DISPLAY_NAME_MAX_LENGTH = 80;
const BIO_MAX_LENGTH = 500;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

@Injectable()
export class UserProfileService {
  constructor(
    private readonly profileRepository: UserProfileRepository,
    private readonly userRepository?: UserRepository,
    private readonly visibilityService?: UserProfileVisibilityService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  validateUsername(username: string) {
    try {
      return validateUsernamePolicy(username);
    } catch (error) {
      if (error instanceof UsernamePolicyError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  buildPublicUrl(usernameNormalized: string): string {
    return `/u/${usernameNormalized}`;
  }

  findByUserId(userId: Types.ObjectId | string): Promise<UserProfileDocument | null> {
    return this.profileRepository.findByUserId(userId);
  }

  findByUsername(username: string): Promise<UserProfileDocument | null> {
    const { usernameNormalized } = this.validateUsername(username);

    return this.profileRepository.findByUsernameNormalized(usernameNormalized);
  }

  async getPublicProfileByUsername(username: string): Promise<PublicProfileResponseDto> {
    if (!this.userRepository || !this.visibilityService) {
      throw new Error('Profile public lookup dependencies are not registered.');
    }

    const { usernameNormalized } = this.validateUsername(username);
    const profile = await this.profileRepository.findByUsernameNormalized(usernameNormalized);

    if (!profile) {
      return createProfileNotFoundState();
    }

    const user = await this.userRepository.findById(String(profile.userId));
    const access = this.visibilityService.evaluatePublicAccess({
      user,
      profile,
    });

    if (access.state === 'not_found') {
      return createProfileNotFoundState();
    }

    if (access.state === 'private') {
      return createPrivateProfileState();
    }

    return toPublicUserProfileDto(profile);
  }

  async getMyProfile(userId: string): Promise<MyUserProfileDto> {
    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      throw new BadRequestException('Profile does not exist.');
    }

    return toMyUserProfileDto(profile);
  }

  async updateMyProfile(userId: string, input: UpdateMyProfileDto): Promise<MyUserProfileDto> {
    if (this.visibilityService) {
      const existing = await this.profileRepository.findByUserId(userId);

      if (
        existing &&
        !this.visibilityService.canUpdateOwnProfile(userId, String(existing.userId))
      ) {
        throw new ForbiddenException('Cannot update this profile.');
      }
    }

    const updated = await this.updateProfileBase(userId, input);

    if (!updated) {
      throw new BadRequestException('Profile does not exist.');
    }

    void this.auditService?.log({
      actorId: userId,
      actorType: 'user',
      action: AuditAction.PROFILE_UPDATED,
      resourceType: 'profile',
      resourceId: userId,
      severity: 'info',
    });

    return toMyUserProfileDto(updated);
  }

  async isUsernameAvailable(
    username: string,
    excludeUserId?: Types.ObjectId | string,
  ): Promise<boolean> {
    const { usernameNormalized } = this.validateUsername(username);

    return !(await this.profileRepository.isUsernameTaken(usernameNormalized, excludeUserId));
  }

  async createProfile(input: CreateUserProfileInput): Promise<UserProfileDocument> {
    const username = this.validateUsername(input.username);
    const displayName = this.validateDisplayName(input.displayName);
    const bio = this.validateOptionalBio(input.bio);
    const visibility = this.validateVisibility(input.visibility ?? 'public');
    const usernameTaken = await this.profileRepository.isUsernameTaken(username.usernameNormalized);

    if (usernameTaken) {
      throw new ConflictException('Username is not available.');
    }

    return this.profileRepository.createProfile({
      userId: input.userId,
      username: username.username,
      usernameNormalized: username.usernameNormalized,
      displayName,
      ...(input.avatarMediaId !== undefined
        ? { avatarMediaId: this.validateAvatarMediaId(input.avatarMediaId) }
        : {}),
      ...(bio !== undefined ? { bio } : {}),
      visibility,
      publicUrl: this.buildPublicUrl(username.usernameNormalized),
    });
  }

  async updateProfileBase(
    userId: Types.ObjectId | string,
    input: UpdateUserProfileInput,
  ): Promise<UserProfileDocument | null> {
    const update: {
      username?: string;
      usernameNormalized?: string;
      displayName?: string;
      avatarMediaId?: Types.ObjectId | string | null;
      bio?: string | null;
      visibility?: ProfileVisibility;
      publicUrl?: string;
    } = {};

    if (input.username !== undefined) {
      const username = this.validateUsername(input.username);
      const usernameTaken = await this.profileRepository.isUsernameTaken(
        username.usernameNormalized,
        userId,
      );

      if (usernameTaken) {
        throw new ConflictException('Username is not available.');
      }

      update.username = username.username;
      update.usernameNormalized = username.usernameNormalized;
      update.publicUrl = this.buildPublicUrl(username.usernameNormalized);
    }

    if (input.displayName !== undefined) {
      update.displayName = this.validateDisplayName(input.displayName);
    }

    if (input.avatarMediaId !== undefined) {
      update.avatarMediaId =
        input.avatarMediaId === null ? null : this.validateAvatarMediaId(input.avatarMediaId);
    }

    if (input.bio === null) {
      update.bio = null;
    } else if (input.bio !== undefined) {
      const bio = this.validateOptionalBio(input.bio);

      if (bio !== undefined) {
        update.bio = bio;
      }
    }

    if (input.visibility !== undefined) {
      update.visibility = this.validateVisibility(input.visibility);
    }

    return this.profileRepository.updateProfile(userId, update);
  }

  private validateDisplayName(displayName: string): string {
    const value = displayName.trim();

    if (!value) {
      throw new BadRequestException('Display name is required.');
    }

    if (value.length > DISPLAY_NAME_MAX_LENGTH) {
      throw new BadRequestException('Display name is too long.');
    }

    return value;
  }

  private validateOptionalBio(bio?: string): string | undefined {
    if (bio === undefined) {
      return undefined;
    }

    const value = bio.trim();

    if (value.length > BIO_MAX_LENGTH) {
      throw new BadRequestException('Bio is too long.');
    }

    return value;
  }

  private validateVisibility(visibility: string): ProfileVisibility {
    if (!PROFILE_VISIBILITIES.includes(visibility as ProfileVisibility)) {
      throw new BadRequestException('Invalid profile visibility.');
    }

    return visibility as ProfileVisibility;
  }

  private validateAvatarMediaId(avatarMediaId: Types.ObjectId | string): Types.ObjectId | string {
    if (typeof avatarMediaId !== 'string') {
      return avatarMediaId;
    }

    if (!OBJECT_ID_PATTERN.test(avatarMediaId)) {
      throw new BadRequestException('avatarMediaId must be a valid ObjectId.');
    }

    return avatarMediaId;
  }
}
