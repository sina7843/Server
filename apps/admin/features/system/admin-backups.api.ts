import { createAdminBackupsClient } from '@dragon/sdk';
import type {
  ApiClient,
  BackupLogDto,
  BackupLogListQueryDto,
  BackupLogListResponseDto,
  RunBackupResponseDto,
} from '@dragon/sdk';

export async function listBackups(
  client: ApiClient,
  params?: BackupLogListQueryDto,
): Promise<BackupLogListResponseDto> {
  return createAdminBackupsClient(client).listBackups(params);
}

export async function getLatestBackup(client: ApiClient): Promise<BackupLogDto | null> {
  return createAdminBackupsClient(client).getLatestBackup();
}

export async function runBackup(client: ApiClient): Promise<RunBackupResponseDto> {
  return createAdminBackupsClient(client).runBackup({});
}
