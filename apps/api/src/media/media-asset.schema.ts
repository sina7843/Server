import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import {
  MEDIA_ASSET_STATUSES,
  MEDIA_VARIANT_TYPES,
  MEDIA_VISIBILITIES,
  MEDIA_STORAGE_PROVIDERS,
  type MediaAssetStatus,
  type MediaVariantType,
  type MediaVisibility,
  type MediaStorageProvider,
} from '@dragon/types';

export interface MediaVariantData {
  readonly type: MediaVariantType;
  readonly objectKey: string;
  readonly width?: number;
  readonly height?: number;
  readonly sizeBytes?: number;
  readonly mimeType?: string;
}

@Schema({ collection: 'media_assets', timestamps: true })
export class MediaAsset {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare originalName: string;

  @Prop({ required: true, trim: true })
  declare fileName: string;

  @Prop({ required: true, trim: true })
  declare mimeType: string;

  @Prop({ required: true, trim: true, lowercase: true })
  declare extension: string;

  @Prop({ required: true, min: 0 })
  declare sizeBytes: number;

  @Prop({ required: true, enum: MEDIA_STORAGE_PROVIDERS })
  declare storageProvider: MediaStorageProvider;

  @Prop({ required: true, trim: true })
  declare bucket: string;

  @Prop({ required: true, trim: true })
  declare objectKey: string;

  @Prop({ required: true, enum: MEDIA_VISIBILITIES, default: 'public' })
  declare visibility: MediaVisibility;

  @Prop({
    type: [
      {
        type: { type: String, enum: MEDIA_VARIANT_TYPES, required: true },
        objectKey: { type: String, required: true },
        width: { type: Number },
        height: { type: Number },
        sizeBytes: { type: Number },
        mimeType: { type: String },
        _id: false,
      },
    ],
    default: [],
  })
  declare variants: MediaVariantData[];

  @Prop()
  declare width?: number;

  @Prop()
  declare height?: number;

  @Prop({ trim: true })
  declare alt?: string;

  @Prop({ trim: true })
  declare caption?: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  declare uploadedBy: Types.ObjectId;

  @Prop({ required: true, enum: MEDIA_ASSET_STATUSES, default: 'uploaded' })
  declare status: MediaAssetStatus;

  @Prop({ trim: true })
  declare checksum?: string;

  declare createdAt: Date;
  declare updatedAt: Date;

  @Prop()
  declare deletedAt?: Date;
}

export type MediaAssetDocument = HydratedDocument<MediaAsset>;
export const MediaAssetSchema = SchemaFactory.createForClass(MediaAsset);

MediaAssetSchema.index({ uploadedBy: 1 });
MediaAssetSchema.index({ status: 1 });
MediaAssetSchema.index({ visibility: 1 });
MediaAssetSchema.index({ mimeType: 1 });
MediaAssetSchema.index({ createdAt: -1 });
MediaAssetSchema.index({ checksum: 1 }, { sparse: true });
