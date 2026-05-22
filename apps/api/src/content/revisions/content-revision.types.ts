import type { Types } from 'mongoose';
import type { ContentResourceType } from '@dragon/types';

export type ContentRevisionId = Types.ObjectId | string;

export interface CreateContentRevisionInput {
  readonly resourceType: ContentResourceType;
  readonly resourceId: Types.ObjectId | string;
  readonly revisionNumber: number;
  readonly snapshot: Record<string, unknown>;
  readonly createdBy: Types.ObjectId | string;
}
