import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type {
  BackupLogDto,
  BackupLogListItemDto,
  BackupLogListResponseDto,
  BackupTriggeredBy,
  RunBackupResponseDto,
} from '@dragon/types';
import { STORAGE_CONFIG, type StorageConfig } from '../config/storage.config';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { BackupLogRepository, type BackupLogFilters } from './backup-log.repository';
import type { BackupLogDocument } from './backup-log.schema';
import type { BackupQueryDto } from './dto/backup-query';

const MAX_ERROR_LENGTH = 200;
const URI_PATTERN = /[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s]*/g;
const PASSWORD_PATTERN = /password[=\s:]+[^\s&,'"]+/gi;

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly repository: BackupLogRepository,
    private readonly auditService: AuditService,
    @Optional() @Inject(STORAGE_SERVICE) private readonly storageService: StorageService | null,
    @Optional() @Inject(STORAGE_CONFIG) private readonly storageConfig: StorageConfig | null,
  ) {}

  async listBackups(query: BackupQueryDto): Promise<BackupLogListResponseDto> {
    const filters: BackupLogFilters = {
      ...(query.type !== undefined ? { type: query.type } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    };

    const { items, total } = await this.repository.list(filters, query.page, query.limit);
    return {
      items: items.map((d) => this.toListItemDto(d)),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async getLatestBackup(): Promise<BackupLogDto | null> {
    const doc = await this.repository.findLatest();
    return doc ? this.toDto(doc) : null;
  }

  async runMongoBackup(
    triggeredBy: BackupTriggeredBy,
    actorId?: string,
  ): Promise<RunBackupResponseDto> {
    const doc = await this.repository.create({
      type: 'mongodb',
      triggeredBy,
      ...(actorId !== undefined ? { actorId } : {}),
    });
    const id = String(doc._id);

    await this.auditService.log({
      actorType: triggeredBy === 'admin' ? 'admin' : 'system',
      ...(actorId !== undefined ? { actorId } : {}),
      action: 'system.backup_started',
      resourceType: 'backup_log',
      resourceId: id,
      metadata: { type: 'mongodb', triggeredBy },
      severity: 'info',
    });

    if (triggeredBy === 'admin') {
      await this.auditService.log({
        actorType: 'admin',
        ...(actorId !== undefined ? { actorId } : {}),
        action: 'system.backup_manual_triggered',
        resourceType: 'backup_log',
        resourceId: id,
        severity: 'info',
      });
    }

    setImmediate(() => {
      this.executeMongoBackup(id).catch((err: unknown) => {
        this.logger.error(`Unexpected error in backup execution for ${id}: ${String(err)}`);
      });
    });

    return {
      id,
      type: 'mongodb',
      status: 'started',
      triggeredBy,
      startedAt: doc.startedAt.toISOString(),
      message: 'Backup started. Check backup logs for status.',
    };
  }

  private async executeMongoBackup(logId: string): Promise<void> {
    const tmpBase = process.env['BACKUP_TEMP_DIR'] ?? '/tmp/dragon-backups';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = randomUUID().slice(0, 8);
    const dirName = `mongo-${timestamp}-${uniqueId}`;
    const backupDir = join(tmpBase, dirName);
    const tarPath = `${backupDir}.tar.gz`;

    const mongoUri = process.env['BACKUP_MONGODB_URI'] ?? process.env['MONGODB_URI'];
    if (!mongoUri) {
      await this.repository.markFailed(logId, 'MongoDB connection string not configured');
      await this.emitFailedAudit(logId);
      return;
    }

    try {
      await fs.mkdir(backupDir, { recursive: true });

      await this.spawnSafe('mongodump', ['--uri', mongoUri, '--out', backupDir]);

      await this.spawnSafe('tar', ['-czf', tarPath, '-C', tmpBase, dirName]);

      const stats = await fs.stat(tarPath);
      const sizeBytes = stats.size;

      let fileKey: string | undefined;
      let bucket: string | undefined;

      if (this.storageService && this.storageConfig && this.storageConfig.provider !== 'local') {
        const prefix = (process.env['BACKUP_STORAGE_BUCKET_PREFIX'] ?? 'backups/mongodb').replace(
          /\/+$/,
          '',
        );
        const safeId = randomUUID().replace(/-/g, '');
        const safeTs = timestamp.replace(/[^a-zA-Z0-9-]/g, '-');
        fileKey = `${prefix}/${safeTs}-${safeId}.tar.gz`;

        const body = await fs.readFile(tarPath);
        await this.storageService.upload({
          objectKey: fileKey,
          body,
          mimeType: 'application/gzip',
          sizeBytes,
        });
        bucket = this.storageConfig.bucket;

        await fs.rm(backupDir, { recursive: true, force: true }).catch(() => undefined);
        await fs.unlink(tarPath).catch(() => undefined);
      }

      await this.repository.markCompleted(logId, {
        completedAt: new Date(),
        ...(fileKey !== undefined ? { fileKey } : {}),
        ...(bucket !== undefined ? { bucket } : {}),
        sizeBytes,
      });

      await this.auditService.log({
        actorType: 'system',
        action: 'system.backup_completed',
        resourceType: 'backup_log',
        resourceId: logId,
        metadata: { sizeBytes, uploaded: fileKey !== undefined },
        severity: 'info',
      });
    } catch (err) {
      const safeError = this.sanitizeError(err);
      await this.repository.markFailed(logId, safeError);
      await this.emitFailedAudit(logId);
    } finally {
      await fs.rm(backupDir, { recursive: true, force: true }).catch(() => undefined);
      await fs.unlink(tarPath).catch(() => undefined);
    }
  }

  private spawnSafe(cmd: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, { stdio: 'pipe' });
      let stderr = '';
      proc.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString().slice(0, 500);
      });
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(`${cmd} exited with code ${String(code)}: ${this.sanitizeError(stderr)}`),
          );
        }
      });
      proc.on('error', (err) =>
        reject(new Error(`${cmd} spawn error: ${this.sanitizeError(err)}`)),
      );
    });
  }

  private sanitizeError(err: unknown): string {
    const raw = err instanceof Error ? err.message : String(err);
    return raw
      .replace(URI_PATTERN, '[redacted-uri]')
      .replace(PASSWORD_PATTERN, 'password=[redacted]')
      .substring(0, MAX_ERROR_LENGTH);
  }

  private async emitFailedAudit(logId: string): Promise<void> {
    await this.auditService.log({
      actorType: 'system',
      action: 'system.backup_failed',
      resourceType: 'backup_log',
      resourceId: logId,
      severity: 'warning',
    });
  }

  private toDto(doc: BackupLogDocument): BackupLogDto {
    return {
      id: String(doc._id),
      type: doc.type,
      status: doc.status,
      ...(doc.fileKey !== undefined ? { fileKey: doc.fileKey } : {}),
      ...(doc.bucket !== undefined ? { bucket: doc.bucket } : {}),
      ...(doc.sizeBytes !== undefined ? { sizeBytes: doc.sizeBytes } : {}),
      startedAt: doc.startedAt.toISOString(),
      ...(doc.completedAt !== undefined ? { completedAt: doc.completedAt.toISOString() } : {}),
      triggeredBy: doc.triggeredBy,
      ...(doc.actorId !== undefined ? { actorId: String(doc.actorId) } : {}),
      ...(doc.error !== undefined ? { error: doc.error } : {}),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private toListItemDto(doc: BackupLogDocument): BackupLogListItemDto {
    return {
      id: String(doc._id),
      type: doc.type,
      status: doc.status,
      ...(doc.fileKey !== undefined ? { fileKey: doc.fileKey } : {}),
      ...(doc.bucket !== undefined ? { bucket: doc.bucket } : {}),
      ...(doc.sizeBytes !== undefined ? { sizeBytes: doc.sizeBytes } : {}),
      startedAt: doc.startedAt.toISOString(),
      ...(doc.completedAt !== undefined ? { completedAt: doc.completedAt.toISOString() } : {}),
      triggeredBy: doc.triggeredBy,
      ...(doc.error !== undefined ? { error: doc.error } : {}),
      createdAt: doc.createdAt.toISOString(),
    };
  }
}
