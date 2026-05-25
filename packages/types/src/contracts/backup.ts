export type BackupType = 'mongodb' | 'media_metadata' | 'manual';
export type BackupStatus = 'started' | 'completed' | 'failed';
export type BackupTriggeredBy = 'system' | 'admin' | 'manual_script';

export const BACKUP_TYPES: readonly BackupType[] = ['mongodb', 'media_metadata', 'manual'];
export const BACKUP_STATUSES: readonly BackupStatus[] = ['started', 'completed', 'failed'];
export const BACKUP_TRIGGERED_BY_VALUES: readonly BackupTriggeredBy[] = [
  'system',
  'admin',
  'manual_script',
];

export interface BackupLogDto {
  readonly id: string;
  readonly type: BackupType;
  readonly status: BackupStatus;
  readonly fileKey?: string;
  readonly bucket?: string;
  readonly sizeBytes?: number;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly triggeredBy: BackupTriggeredBy;
  readonly actorId?: string;
  readonly error?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BackupLogListItemDto {
  readonly id: string;
  readonly type: BackupType;
  readonly status: BackupStatus;
  readonly fileKey?: string;
  readonly bucket?: string;
  readonly sizeBytes?: number;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly triggeredBy: BackupTriggeredBy;
  readonly error?: string;
  readonly createdAt: string;
}

export interface BackupLogListQueryDto {
  readonly type?: BackupType;
  readonly status?: BackupStatus;
  readonly page?: number;
  readonly limit?: number;
}

export interface BackupLogListResponseDto {
  readonly items: BackupLogListItemDto[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export interface RunBackupRequestDto {
  readonly type?: BackupType;
}

export interface RunBackupResponseDto {
  readonly id: string;
  readonly type: BackupType;
  readonly status: 'started';
  readonly triggeredBy: BackupTriggeredBy;
  readonly startedAt: string;
  readonly message: string;
}
