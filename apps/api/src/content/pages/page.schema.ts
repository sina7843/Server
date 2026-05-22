import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { CONTENT_STATUSES, type ContentStatus } from '@dragon/types';
import type { PageSeoData } from './page.types';

@Schema({ collection: 'pages', timestamps: true })
export class Page {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare title: string;

  @Prop({ required: true, trim: true })
  declare slug: string;

  @Prop({ required: true, trim: true, lowercase: true })
  declare slugNormalized: string;

  @Prop({ type: [String], default: [] })
  declare slugHistory: string[];

  @Prop({ type: SchemaTypes.Mixed, required: true, default: {} })
  declare bodyJson: Record<string, unknown>;

  @Prop({ required: true, default: '' })
  declare bodyHtml: string;

  @Prop({ required: true, enum: CONTENT_STATUSES, default: 'draft' })
  declare status: ContentStatus;

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
  declare seo: PageSeoData;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  declare createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  declare updatedBy?: Types.ObjectId;

  @Prop()
  declare publishedAt?: Date;

  declare createdAt: Date;
  declare updatedAt: Date;

  @Prop()
  declare deletedAt?: Date;
}

export type PageDocument = HydratedDocument<Page>;
export const PageSchema = SchemaFactory.createForClass(Page);

PageSchema.index({ slugNormalized: 1 }, { unique: true });
PageSchema.index({ status: 1 });
PageSchema.index({ createdAt: 1 });
PageSchema.index({ title: 'text', bodyHtml: 'text' });
