import type { ApiClient } from './client';
import type {
  BackupLogListQueryDto,
  BackupLogListResponseDto,
  BackupLogDto,
  RunBackupRequestDto,
  RunBackupResponseDto,
} from './admin-backup-types';

export interface AdminBackupsClient {
  listBackups(params?: BackupLogListQueryDto): Promise<BackupLogListResponseDto>;
  getLatestBackup(): Promise<BackupLogDto | null>;
  runBackup(input?: RunBackupRequestDto): Promise<RunBackupResponseDto>;
}

export function createAdminBackupsClient(client: ApiClient): AdminBackupsClient {
  return {
    listBackups(params?: BackupLogListQueryDto) {
      const qs = new URLSearchParams();
      if (params?.type !== undefined) qs.set('type', params.type);
      if (params?.status !== undefined) qs.set('status', params.status);
      if (params?.page !== undefined) qs.set('page', String(params.page));
      if (params?.limit !== undefined) qs.set('limit', String(params.limit));
      const query = qs.toString();
      return client.request<BackupLogListResponseDto>({
        method: 'GET',
        path: query ? `/admin/v1/system/backups?${query}` : '/admin/v1/system/backups',
      });
    },

    getLatestBackup() {
      return client.request<BackupLogDto | null>({
        method: 'GET',
        path: '/admin/v1/system/backups/latest',
      });
    },

    runBackup(input?: RunBackupRequestDto) {
      return client.request<RunBackupResponseDto>({
        method: 'POST',
        path: '/admin/v1/system/backups/run',
        body: JSON.stringify(input ?? {}),
      });
    },
  };
}
