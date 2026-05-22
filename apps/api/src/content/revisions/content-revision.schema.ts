import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { CONTENT_RESOURCE_TYPES, type ContentResourceType } from '@dragon/types';

@Schema({ collection: 'content_revisions', timestamps: { createdAt: true, updatedAt: false } })
export class ContentRevision {
  declare _id: Types.ObjectId;

  @Prop({ required: true, enum: CONTENT_RESOURCE_TYPES })
  declare resourceType: ContentResourceType;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  declare resourceId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  declare revisionNumber: number;

  @Prop({ type: SchemaTypes.Mixed, required: true, default: {} })
  declare snapshot: Record<string, unknown>;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  declare createdBy: Types.ObjectId;

  declare createdAt: Date;
}

export type ContentRevisionDocument = HydratedDocument<ContentRevision>;
export const ContentRevisionSchema = SchemaFactory.createForClass(ContentRevision);

ContentRevisionSchema.index({ resourceType: 1, resourceId: 1, revisionNumber: 1 }, { unique: true });
ContentRevisionSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
