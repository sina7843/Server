import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
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
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([{ name: UserProfile.name, schema: UserProfileSchema }]),
  ],
  controllers: [ProfileController, MeProfileController],
  providers: [
    UserProfileRepository,
    UserProfileService,
    UserProfileLifecycleService,
    UserProfileVisibilityService,
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
