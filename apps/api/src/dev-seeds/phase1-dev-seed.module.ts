import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsEvent, AnalyticsEventSchema } from '../analytics/analytics-event.schema';
import { AuditLog, AuditLogSchema } from '../audit/audit-log.schema';
import { NotificationLog, NotificationLogSchema } from '../auth/notifications/notification-log.schema';
import { User, UserSchema } from '../auth/users/user.schema';
import { BackupLog, BackupLogSchema } from '../backups/backup-log.schema';
import { AppConfigModule } from '../config/app-config.module';
import { Category, CategorySchema } from '../content/categories/category.schema';
import { Page, PageSchema } from '../content/pages/page.schema';
import { Post, PostSchema } from '../content/posts/post.schema';
import { Tag, TagSchema } from '../content/tags/tag.schema';
import { DatabaseModule } from '../database/database.module';
import { Game, GameSchema } from '../games/game.schema';
import { JobLog, JobLogSchema } from '../jobs/job-log.schema';
import { MediaAsset, MediaAssetSchema } from '../media/media-asset.schema';
import {
  NotificationTemplate,
  NotificationTemplateSchema,
} from '../notifications/notification-template.schema';
import { UserProfile, UserProfileSchema } from '../profiles/profile.schema';
import { Permission, PermissionSchema } from '../rbac/permissions/permission.schema';
import { RolePermission, RolePermissionSchema } from '../rbac/role-permissions/role-permission.schema';
import { Role, RoleSchema } from '../rbac/roles/role.schema';
import { UserRole, UserRoleSchema } from '../rbac/user-roles/user-role.schema';
import { TournamentMatch, TournamentMatchSchema } from '../tournament-matches/tournament-match.schema';
import {
  TournamentRegistration,
  TournamentRegistrationSchema,
} from '../tournament-registrations/tournament-registration.schema';
import { Tournament, TournamentSchema } from '../tournaments/tournament.schema';
import { Phase1DevSeedService } from './phase1-dev-seed.service';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: Role.name, schema: RoleSchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: UserRole.name, schema: UserRoleSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Tag.name, schema: TagSchema },
      { name: Post.name, schema: PostSchema },
      { name: Page.name, schema: PageSchema },
      { name: MediaAsset.name, schema: MediaAssetSchema },
      { name: Game.name, schema: GameSchema },
      { name: Tournament.name, schema: TournamentSchema },
      { name: TournamentRegistration.name, schema: TournamentRegistrationSchema },
      { name: TournamentMatch.name, schema: TournamentMatchSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
      { name: JobLog.name, schema: JobLogSchema },
      { name: BackupLog.name, schema: BackupLogSchema },
    ]),
  ],
  providers: [Phase1DevSeedService],
})
export class Phase1DevSeedModule {}
