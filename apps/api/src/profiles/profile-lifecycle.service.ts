import { Injectable } from '@nestjs/common';
import { UserRepository } from '../auth/users/user.repository';
import type {
  EnsureProfileForActiveUserInput,
  ProfileUserLike,
  UserProfileLike,
} from './profile.types';
import { UserProfileRepository } from './profile.repository';
import { UserProfileService } from './profile.service';
import { UsernamePolicyError, validateUsernamePolicy } from './username/username-policy';

const DEFAULT_DISPLAY_NAME = 'User';
const MAX_USERNAME_CANDIDATES = 25;

@Injectable()
export class UserProfileLifecycleService {
  constructor(
    private readonly profileRepository: UserProfileRepository,
    private readonly profileService: UserProfileService,
    private readonly userRepository: UserRepository,
  ) {}

  async ensureProfileForVerifiedUser(userId: string): Promise<UserProfileLike | null> {
    return this.ensureProfileForActiveUser({ userId });
  }

  async ensureProfileForActiveUser(
    input: EnsureProfileForActiveUserInput,
  ): Promise<UserProfileLike | null> {
    const existing = await this.profileRepository.findByUserId(input.userId);

    if (existing) {
      return existing;
    }

    const user = await this.userRepository.findById(input.userId);

    if (!this.canCreateProfileForUser(user as ProfileUserLike | null)) {
      return null;
    }

    const displayName = this.resolveDisplayName(input.displayName);
    const username = await this.generateAvailableUsername(input);

    return this.profileService.createProfile({
      userId: input.userId,
      username,
      displayName,
      visibility: 'public',
    });
  }

  private canCreateProfileForUser(user: ProfileUserLike | null): boolean {
    return Boolean(user && user.status === 'active' && user.phoneVerifiedAt instanceof Date);
  }

  private resolveDisplayName(displayName?: string): string {
    const normalizedDisplayName = displayName?.trim();

    return normalizedDisplayName || DEFAULT_DISPLAY_NAME;
  }

  private async generateAvailableUsername(input: EnsureProfileForActiveUserInput): Promise<string> {
    const candidates = this.buildUsernameCandidates(input);

    for (const candidate of candidates) {
      if (await this.profileService.isUsernameAvailable(candidate, input.userId)) {
        return candidate;
      }
    }

    throw new UsernamePolicyError('username_invalid_format', 'Unable to generate a safe username.');
  }

  private buildUsernameCandidates(input: EnsureProfileForActiveUserInput): string[] {
    const candidates: string[] = [];

    if (input.preferredUsername) {
      candidates.push(input.preferredUsername);
    }

    const shortUserId = this.shortUserId(input.userId);
    const baseCandidate = `user-${shortUserId}`;

    candidates.push(baseCandidate);

    for (let index = 2; index <= MAX_USERNAME_CANDIDATES; index += 1) {
      candidates.push(`${baseCandidate}-${index}`);
    }

    return [...new Set(candidates)].filter((candidate) => {
      try {
        validateUsernamePolicy(candidate);
        return !this.containsPrivateIdentifier(candidate, input);
      } catch {
        return false;
      }
    });
  }

  private shortUserId(userId: string): string {
    const sanitized = userId.toLowerCase().replace(/[^a-z0-9]/g, '');

    return sanitized.slice(-8) || 'profile';
  }

  private containsPrivateIdentifier(
    candidate: string,
    input: EnsureProfileForActiveUserInput,
  ): boolean {
    if (!input.phoneNormalized) {
      return false;
    }

    const digits = input.phoneNormalized.replace(/\D/g, '');

    if (!digits) {
      return false;
    }

    return candidate.includes(digits) || candidate.includes(digits.slice(-4));
  }
}
