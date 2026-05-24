import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  NotificationTemplate,
  type NotificationTemplateDocument,
} from './notification-template.schema';

@Injectable()
export class NotificationTemplateRepository {
  constructor(
    @InjectModel(NotificationTemplate.name)
    private readonly model: Model<NotificationTemplateDocument>,
  ) {}

  findTemplate(
    key: string,
    channel: string,
    locale: string,
  ): Promise<NotificationTemplateDocument | null> {
    return this.model.findOne({ key, channel, locale, isActive: true }).exec();
  }

  create(input: {
    key: string;
    channel: string;
    locale: string;
    body: string;
    variables?: string[];
    isActive?: boolean;
  }): Promise<NotificationTemplateDocument> {
    return this.model.create({
      key: input.key,
      channel: input.channel,
      locale: input.locale,
      body: input.body,
      variables: input.variables ?? [],
      isActive: input.isActive ?? true,
    });
  }
}
