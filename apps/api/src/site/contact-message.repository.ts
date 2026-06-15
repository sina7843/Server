import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContactMessage, type ContactMessageDocument } from './contact-message.schema';
import type { CreateContactMessageInput, ContactMessageListFilter } from './contact-message.types';

@Injectable()
export class ContactMessageRepository {
  constructor(
    @InjectModel(ContactMessage.name) private readonly model: Model<ContactMessageDocument>,
  ) {}

  create(input: CreateContactMessageInput): Promise<ContactMessageDocument> {
    return this.model.create({ ...input }) as Promise<ContactMessageDocument>;
  }

  findById(id: string): Promise<ContactMessageDocument | null> {
    return this.model.findById(id).exec();
  }

  async list(
    filter: ContactMessageListFilter,
  ): Promise<{ items: ContactMessageDocument[]; total: number }> {
    const skip = (filter.page - 1) * filter.limit;
    const [items, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip(skip).limit(filter.limit).exec(),
      this.model.countDocuments().exec(),
    ]);
    return { items, total };
  }

  deleteById(id: string): Promise<ContactMessageDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
