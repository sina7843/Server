import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactMessageRepository } from './contact-message.repository';
import type { ContactMessageDocument } from './contact-message.schema';
import type { CreateContactMessageInput } from './contact-message.types';

@Injectable()
export class ContactMessageService {
  constructor(private readonly repository: ContactMessageRepository) {}

  submit(input: CreateContactMessageInput): Promise<ContactMessageDocument> {
    return this.repository.create(input);
  }

  list(page: number, limit: number): Promise<{ items: ContactMessageDocument[]; total: number }> {
    return this.repository.list({ page, limit });
  }

  async getById(id: string): Promise<ContactMessageDocument> {
    const doc = await this.repository.findById(id);
    if (!doc) throw new NotFoundException('Contact message not found.');
    return doc;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) throw new NotFoundException('Contact message not found.');
  }
}
