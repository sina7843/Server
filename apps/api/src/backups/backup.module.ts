import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from '../audit/audit.module';
import { RbacModule } from '../rbac/rbac.module';
import { StorageModule } from '../storage/storage.module';
import { BackupLog, BackupLogSchema } from './backup-log.schema';
import { BackupLogRepository } from './backup-log.repository';
import { BackupService } from './backup.service';
import { AdminBackupController } from './admin-backup.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BackupLog.name, schema: BackupLogSchema }]),
    AuditModule,
    RbacModule,
    StorageModule,
  ],
  controllers: [AdminBackupController],
  providers: [BackupLogRepository, BackupService],
  exports: [BackupService],
})
export class BackupsModule {}
