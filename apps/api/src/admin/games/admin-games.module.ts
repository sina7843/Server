import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';
import { GamesModule } from '../../games/games.module';
import { AdminGamesController } from './admin-games.controller';

@Module({
  imports: [AuditModule, AuthModule, RbacModule, GamesModule],
  controllers: [AdminGamesController],
})
export class AdminGamesModule {}
