import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type {
  BackupLogDto,
  BackupLogListResponseDto,
  RunBackupRequestDto,
  RunBackupResponseDto,
} from '@dragon/types';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthContext } from '../auth/guards/authenticated-request';
import { CurrentAuthContext } from '../auth/guards/current-auth-context.decorator';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permissions } from '../rbac/registry/permission-keys';
import { BackupService } from './backup.service';
import { parseBackupQuery } from './dto/backup-query';

@Controller('admin/v1/system/backups')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminBackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @RequirePermission(Permissions.SYSTEM_BACKUP_READ)
  listBackups(@Query() query: unknown): Promise<BackupLogListResponseDto> {
    return this.backupService.listBackups(parseBackupQuery(query));
  }

  @Get('latest')
  @RequirePermission(Permissions.SYSTEM_BACKUP_READ)
  getLatestBackup(): Promise<BackupLogDto | null> {
    return this.backupService.getLatestBackup();
  }

  @Post('run')
  @RequirePermission(Permissions.SYSTEM_BACKUP_RUN)
  runBackup(
    @Body() _body: RunBackupRequestDto,
    @CurrentAuthContext() authContext: AuthContext,
  ): Promise<RunBackupResponseDto> {
    return this.backupService.runMongoBackup('admin', authContext.userId);
  }
}
