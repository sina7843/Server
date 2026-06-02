import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BackupsModule } from './backups/backup.module';
import { AdminAuditModule } from './admin/audit/admin-audit.module';
import { SearchModule } from './search/search.module';
import { AdminAnalyticsModule } from './analytics/admin/admin-analytics.module';
import { AdminNotificationsModule } from './admin/notifications/admin-notifications.module';
import { AdminAuthModule } from './admin/admin-auth.module';
import { AdminContentModule } from './admin/content/admin-content.module';
import { AdminDashboardModule } from './admin/dashboard/admin-dashboard.module';
import { AdminJobsModule } from './admin/jobs/admin-jobs.module';
import { AdminSystemModule } from './admin/system/admin-system.module';
import { AdminUsersModule } from './admin/users/admin-users.module';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/app-config.module';
import { ContentModule } from './content/content.module';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { HealthController } from './health.controller';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { MediaModule } from './media/media.module';
import { ProfileModule } from './profiles/profile.module';
import { RbacModule } from './rbac/rbac.module';
import { EsportsModule } from './esports/esports.module';
import { GamesModule } from './games/games.module';
import { AdminGamesModule } from './admin/games/admin-games.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { AdminTournamentsModule } from './admin/tournaments/admin-tournaments.module';
import { TournamentRegistrationsModule } from './tournament-registrations/tournament-registrations.module';
import { AdminTournamentRegistrationsModule } from './admin/tournament-registrations/admin-tournament-registrations.module';
import { AdminTournamentParticipantsModule } from './admin/tournament-participants/admin-tournament-participants.module';
import { TournamentMatchesModule } from './tournament-matches/tournament-matches.module';
import { AdminTournamentMatchesModule } from './admin/tournament-matches/admin-tournament-matches.module';
import { AdminTournamentResultsModule } from './admin/tournament-results/admin-tournament-results.module';
import { TournamentStandingsModule } from './tournament-standings/tournament-standings.module';
import { TournamentBracketModule } from './tournament-bracket/tournament-bracket.module';
import { AdminTournamentStandingsModule } from './admin/tournament-standings/admin-tournament-standings.module';
import { AdminTournamentBracketModule } from './admin/tournament-bracket/admin-tournament-bracket.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    EventsModule,
    JobsModule,
    AuthModule,
    RbacModule,
    ProfileModule,
    ContentModule,
    EsportsModule,
    GamesModule,
    HealthModule,
    BackupsModule,
    AdminAuthModule,
    AdminUsersModule,
    AdminDashboardModule,
    AdminSystemModule,
    AdminContentModule,
    AdminGamesModule,
    TournamentsModule,
    AdminTournamentsModule,
    TournamentRegistrationsModule,
    AdminTournamentRegistrationsModule,
    AdminTournamentParticipantsModule,
    TournamentMatchesModule,
    AdminTournamentMatchesModule,
    AdminTournamentResultsModule,
    TournamentStandingsModule,
    TournamentBracketModule,
    AdminTournamentStandingsModule,
    AdminTournamentBracketModule,
    AdminAuditModule,
    AdminJobsModule,
    AdminNotificationsModule,
    MediaModule,
    SearchModule,
    AdminAnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SecurityHeadersMiddleware, RequestIdMiddleware).forRoutes('*');
  }
}
