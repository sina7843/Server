import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SiteSettings,
  SITE_SETTINGS_KEY,
  type SiteSettingsDocument,
} from './site-settings.schema';
import type { UpdateSiteSettingsInput } from './site-settings.types';

@Injectable()
export class SiteSettingsRepository {
  constructor(
    @InjectModel(SiteSettings.name) private readonly model: Model<SiteSettingsDocument>,
  ) {}

  findSingleton(): Promise<SiteSettingsDocument | null> {
    return this.model.findOne({ key: SITE_SETTINGS_KEY }).exec();
  }

  upsert(input: UpdateSiteSettingsInput): Promise<SiteSettingsDocument | null> {
    const set: Record<string, unknown> = {
      about: input.about,
      contact: input.contact,
    };
    if (input.updatedBy !== undefined) set.updatedBy = input.updatedBy;

    return this.model
      .findOneAndUpdate(
        { key: SITE_SETTINGS_KEY },
        { $set: set },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
