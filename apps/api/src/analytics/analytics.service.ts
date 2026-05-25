import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsEventRepository } from './analytics-event.repository';
import { AnalyticsRedactor } from './analytics-redactor';
import type { TrackInput } from './analytics.types';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly repository: AnalyticsEventRepository,
    private readonly redactor: AnalyticsRedactor,
  ) {}

  track(input: TrackInput): void {
    void this.writeEvent(input).catch((err: unknown) => {
      this.logger.error(`Analytics track failed for type=${input.type}`, {
        type: input.type,
        error: String(err),
      });
    });
  }

  private async writeEvent(input: TrackInput): Promise<void> {
    const redactedMetadata =
      input.metadata !== undefined
        ? (this.redactor.redact(input.metadata) as Record<string, unknown>)
        : undefined;

    await this.repository.create({
      type: input.type,
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
      ...(input.anonymousId !== undefined ? { anonymousId: input.anonymousId } : {}),
      ...(input.resourceType !== undefined ? { resourceType: input.resourceType } : {}),
      ...(input.resourceId !== undefined ? { resourceId: input.resourceId } : {}),
      ...(redactedMetadata !== undefined ? { metadata: redactedMetadata } : {}),
      ...(input.ip !== undefined ? { ipHash: hashIp(input.ip) } : {}),
      ...(input.userAgent !== undefined ? { userAgent: input.userAgent } : {}),
    });
  }
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}
