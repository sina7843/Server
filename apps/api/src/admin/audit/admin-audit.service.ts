import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuditLogDetailDto, AuditLogListResponseDto } from '@dragon/types';
import { AuditLogRepository } from '../../audit/audit-log.repository';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import type { AdminAuditQueryDto } from './dto/admin-audit-query';
import { toAuditLogDetailDto, toAuditLogListResponse } from './dto/admin-audit-response';

@Injectable()
export class AdminAuditService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async listAuditLogs(query: AdminAuditQueryDto): Promise<AuditLogListResponseDto> {
    const { items, total } = await this.auditLogRepository.list(
      query.filters,
      query.page,
      query.limit,
    );
    return toAuditLogListResponse(items, total, query.page, query.limit);
  }

  async getAuditLog(rawId: string): Promise<AuditLogDetailDto> {
    const id = validateObjectId(rawId, 'id');
    const log = await this.auditLogRepository.findById(id);

    if (!log) {
      throw new NotFoundException('Audit log not found.');
    }

    return toAuditLogDetailDto(log);
  }
}
