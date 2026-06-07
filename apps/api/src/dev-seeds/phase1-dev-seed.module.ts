import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app-config.module';
import { DatabaseModule } from '../database/database.module';
import { RbacModule } from '../rbac/rbac.module';
import { Phase1DevSeedService } from './phase1-dev-seed.service';

@Module({
  imports: [AppConfigModule, DatabaseModule, RbacModule],
  providers: [Phase1DevSeedService],
  exports: [Phase1DevSeedService],
})
export class Phase1DevSeedModule {}
