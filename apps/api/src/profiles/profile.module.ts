import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserRepository } from '../auth/users/user.repository';
import { User, UserSchema } from '../auth/users/user.schema';
import { ObjectPolicyService } from '../rbac/policies/object-policy.service';
import { MeProfileController } from './me-profile.controller';
import { ProfileController } from './profile.controller';
import { UserProfileLifecycleService } from './profile-lifecycle.service';
import { UserProfileRepository } from './profile.repository';
import { UserProfile, UserProfileSchema } from './profile.schema';
import { UserProfileService } from './profile.service';
import { UserProfileVisibilityService } from './profile-visibility.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ProfileController, MeProfileController],
  providers: [
    UserProfileRepository,
    UserProfileService,
    UserProfileLifecycleService,
    UserProfileVisibilityService,
    UserRepository,
    ObjectPolicyService,
  ],
  exports: [
    UserProfileRepository,
    UserProfileService,
    UserProfileLifecycleService,
    UserProfileVisibilityService,
  ],
})
export class ProfileModule {}
