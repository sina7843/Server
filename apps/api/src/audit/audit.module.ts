import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from './audit-log.schema';
import { AuditLogRepository } from './audit-log.repository';
import { AuditRedactor } from './audit-redactor';
import { AuditService } from './audit.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])],
  providers: [AuditLogRepository, AuditRedactor, AuditService],
  exports: [AuditLogRepository, AuditService],
})
export class AuditModule {}
