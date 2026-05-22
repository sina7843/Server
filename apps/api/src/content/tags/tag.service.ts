import { ConflictException, Injectable } from '@nestjs/common';
import { normalizeSlug, SlugPolicyError } from '../slug/slug-policy';
import { TagRepository } from './tag.repository';
import type { TagDocument } from './tag.schema';
import type { CreateTagInput, TagId, UpdateTagInput } from './tag.types';

@Injectable()
export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  findById(id: TagId): Promise<TagDocument | null> {
    return this.tagRepository.findById(id);
  }

  findBySlug(slugNormalized: string): Promise<TagDocument | null> {
    return this.tagRepository.findBySlug(slugNormalized);
  }

  list(): Promise<TagDocument[]> {
    return this.tagRepository.list();
  }

  async isSlugTaken(slugNormalized: string, excludeId?: TagId): Promise<boolean> {
    const existing = await this.tagRepository.existsBySlug(slugNormalized, excludeId);
    return existing !== null;
  }

  async create(input: CreateTagInput): Promise<TagDocument> {
    let slugNormalized: string;

    try {
      slugNormalized = normalizeSlug(input.slug);
    } catch (err) {
      if (err instanceof SlugPolicyError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }

    const taken = await this.isSlugTaken(slugNormalized);
    if (taken) {
      throw new ConflictException(`Tag slug "${input.slug}" is already taken.`);
    }

    return this.tagRepository.create({ ...input, slugNormalized });
  }

  update(id: TagId, input: UpdateTagInput): Promise<TagDocument | null> {
    return this.tagRepository.update(id, input);
  }
}
