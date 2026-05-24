import { Injectable, Logger } from '@nestjs/common';
import { AuditLogRepository } from './audit-log.repository';
import { AuditRedactor } from './audit-redactor';
import type { WriteAuditLogInput } from './audit-log.types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly redactor: AuditRedactor,
  ) {}

  async log(input: WriteAuditLogInput): Promise<void> {
    try {
      const normalized: WriteAuditLogInput = { severity: 'info', ...input };
      const redacted = this.redact(normalized);
      await this.auditLogRepository.create(redacted);
    } catch (err) {
      this.logger.error(
        `Audit write failed for action=${input.action} resource=${input.resourceType}/${input.resourceId ?? ''}`,
        { action: input.action, resourceType: input.resourceType, error: String(err) },
      );
    }
  }

  private redact(input: WriteAuditLogInput): WriteAuditLogInput {
    return {
      ...input,
      ...(input.before !== undefined
        ? { before: this.redactor.redact(input.before) as Record<string, unknown> }
        : {}),
      ...(input.after !== undefined
        ? { after: this.redactor.redact(input.after) as Record<string, unknown> }
        : {}),
      ...(input.metadata !== undefined
        ? { metadata: this.redactor.redact(input.metadata) as Record<string, unknown> }
        : {}),
    };
  }
}
