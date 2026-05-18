import { Injectable } from '@nestjs/common';
import { ObjectPolicyService } from '../rbac/policies/object-policy.service';
import type { ProfileUserLike, PublicProfileAccess, UserProfileLike } from './profile.types';

@Injectable()
export class UserProfileVisibilityService {
  constructor(private readonly objectPolicyService: ObjectPolicyService) {}

  evaluatePublicAccess(input: {
    readonly user?: ProfileUserLike | null;
    readonly profile?: UserProfileLike | null;
  }): PublicProfileAccess {
    if (!input.user || !input.profile) {
      return { state: 'not_found' };
    }

    if (input.user.status === 'deleted' || input.user.status === 'banned') {
      return { state: 'not_found' };
    }

    if (input.user.status === 'pending_verification' || input.user.status === 'suspended') {
      return { state: 'private' };
    }

    if (input.profile.visibility === 'private') {
      return { state: 'private' };
    }

    return { state: 'visible' };
  }

  canUpdateOwnProfile(authUserId: string, profileUserId: string): boolean {
    return this.objectPolicyService.canAccessOwnResource({
      userId: authUserId,
      resourceOwnerId: profileUserId,
      resourceType: 'user_profile',
    }).allowed;
  }
}
