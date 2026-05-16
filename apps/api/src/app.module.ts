import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';

@Module({
  imports: [AppConfigModule, DatabaseModule, AuthModule],
  controllers: [HealthController],
})
export class AppModule {}
