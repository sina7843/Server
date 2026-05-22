import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentRevision, type ContentRevisionDocument } from './content-revision.schema';
import type { ContentRevisionId, CreateContentRevisionInput } from './content-revision.types';
import type { ContentResourceType } from '@dragon/types';
import type { Types } from 'mongoose';

@Injectable()
export class ContentRevisionRepository {
  constructor(
    @InjectModel(ContentRevision.name)
    private readonly revisionModel: Model<ContentRevisionDocument>,
  ) {}

  findById(id: ContentRevisionId): Promise<ContentRevisionDocument | null> {
    return this.revisionModel.findById(id).exec();
  }

  listByResource(
    resourceType: ContentResourceType,
    resourceId: Types.ObjectId | string,
  ): Promise<ContentRevisionDocument[]> {
    return this.revisionModel
      .find({ resourceType, resourceId })
      .sort({ revisionNumber: -1 })
      .exec();
  }

  async latestRevisionNumber(
    resourceType: ContentResourceType,
    resourceId: Types.ObjectId | string,
  ): Promise<number> {
    const latest = await this.revisionModel
      .findOne({ resourceType, resourceId })
      .sort({ revisionNumber: -1 })
      .exec();
    return latest?.revisionNumber ?? 0;
  }

  async create(input: CreateContentRevisionInput): Promise<ContentRevisionDocument> {
    const created = await this.revisionModel.create({
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      revisionNumber: input.revisionNumber,
      snapshot: input.snapshot,
      createdBy: input.createdBy,
    });
    return created as ContentRevisionDocument;
  }
}
