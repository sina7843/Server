import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import type { AboutInfo, ContactInfo } from './site-settings.types';

export const SITE_SETTINGS_KEY = 'global';

@Schema({ collection: 'site_settings', timestamps: true })
export class SiteSettings {
  declare _id: Types.ObjectId;

  @Prop({ required: true, default: SITE_SETTINGS_KEY })
  declare key: string;

  @Prop({
    type: {
      title: { type: String, trim: true, default: '' },
      bodyJson: { type: SchemaTypes.Mixed, default: {} },
      bodyHtml: { type: String, default: '' },
    },
    _id: false,
    default: {},
  })
  declare about: AboutInfo;

  @Prop({
    type: {
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      mapEmbedUrl: { type: String, trim: true },
      socials: {
        type: [{ platform: { type: String, trim: true }, url: { type: String, trim: true } }],
        default: [],
        _id: false,
      },
    },
    _id: false,
    default: {},
  })
  declare contact: ContactInfo;

  @Prop({ type: SchemaTypes.ObjectId })
  declare updatedBy?: Types.ObjectId;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type SiteSettingsDocument = HydratedDocument<SiteSettings>;
export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);

SiteSettingsSchema.index({ key: 1 }, { unique: true });
