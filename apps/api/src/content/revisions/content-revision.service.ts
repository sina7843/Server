import { Injectable } from '@nestjs/common';
import { ContentRevisionRepository } from './content-revision.repository';
import type { ContentRevisionDocument } from './content-revision.schema';
import type { ContentRevisionId } from './content-revision.types';
import type { ContentResourceType } from '@dragon/types';
import type { Types } from 'mongoose';

@Injectable()
export class ContentRevisionService {
  constructor(private readonly revisionRepository: ContentRevisionRepository) {}

  findById(id: ContentRevisionId): Promise<ContentRevisionDocument | null> {
    return this.revisionRepository.findById(id);
  }

  listByResource(
    resourceType: ContentResourceType,
    resourceId: Types.ObjectId | string,
  ): Promise<ContentRevisionDocument[]> {
    return this.revisionRepository.listByResource(resourceType, resourceId);
  }

  async snapshot(
    resourceType: ContentResourceType,
    resourceId: Types.ObjectId | string,
    snapshot: Record<string, unknown>,
    createdBy: Types.ObjectId | string,
  ): Promise<ContentRevisionDocument> {
    const latestNumber = await this.revisionRepository.latestRevisionNumber(
      resourceType,
      resourceId,
    );
    return this.revisionRepository.create({
      resourceType,
      resourceId,
      revisionNumber: latestNumber + 1,
      snapshot,
      createdBy,
    });
  }
}
