import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import {
  CONTENT_POST_TYPES,
  CONTENT_STATUSES,
  type ContentPostType,
  type ContentStatus,
} from '@dragon/types';
import type { PostMediaRefData, PostSeoData } from './post.types';

@Schema({ collection: 'posts', timestamps: true })
export class Post {
  declare _id: Types.ObjectId;

  @Prop({ required: true, enum: CONTENT_POST_TYPES })
  declare type: ContentPostType;

  @Prop({ required: true, trim: true })
  declare title: string;

  @Prop({ required: true, trim: true })
  declare slug: string;

  @Prop({ required: true, trim: true, lowercase: true })
  declare slugNormalized: string;

  @Prop({ type: [String], default: [] })
  declare slugHistory: string[];

  @Prop({ trim: true })
  declare excerpt?: string;

  @Prop({ type: SchemaTypes.Mixed, required: true, default: {} })
  declare bodyJson: Record<string, unknown>;

  @Prop({ required: true, default: '' })
  declare bodyHtml: string;

  @Prop({
    type: [
      {
        mediaId: { type: SchemaTypes.ObjectId, required: true },
        usage: { type: String, enum: ['cover', 'inline', 'attachment'], required: true },
        alt: { type: String, trim: true },
        caption: { type: String, trim: true },
        alignment: { type: String, enum: ['left', 'center', 'right', 'full'] },
        _id: false,
      },
    ],
    default: [],
  })
  declare mediaRefs: PostMediaRefData[];

  @Prop({ type: SchemaTypes.ObjectId })
  declare coverMediaId?: Types.ObjectId;

  @Prop({ type: [SchemaTypes.ObjectId], default: [] })
  declare categoryIds: Types.ObjectId[];

  @Prop({ type: [SchemaTypes.ObjectId], default: [] })
  declare tagIds: Types.ObjectId[];

  @Prop({ required: true, enum: CONTENT_STATUSES, default: 'draft' })
  declare status: ContentStatus;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  declare authorId: Types.ObjectId;

  @Prop()
  declare publishedAt?: Date;

  @Prop({
    type: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
      canonicalUrl: { type: String, trim: true },
      noIndex: { type: Boolean },
      ogImageMediaId: { type: SchemaTypes.ObjectId },
    },
    _id: false,
    default: {},
  })
  declare seo: PostSeoData;

  @Prop({ required: true, default: 0, min: 0 })
  declare viewCount: number;

  declare createdAt: Date;
  declare updatedAt: Date;

  @Prop()
  declare deletedAt?: Date;
}

export type PostDocument = HydratedDocument<Post>;
export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ type: 1, slugNormalized: 1 }, { unique: true });
PostSchema.index({ type: 1, status: 1, publishedAt: -1 });
PostSchema.index({ categoryIds: 1 });
PostSchema.index({ tagIds: 1 });
PostSchema.index({ authorId: 1 });
PostSchema.index({ createdAt: 1 });
PostSchema.index({ updatedAt: 1 });
PostSchema.index({ title: 'text', excerpt: 'text', bodyHtml: 'text' });
