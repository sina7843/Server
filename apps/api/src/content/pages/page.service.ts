import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { ContentStatus } from '@dragon/types';
import { isValidContentStatus } from '../shared/content-status';
import { normalizeSlug, SlugPolicyError } from '../slug/slug-policy';
import { PageRepository, type PageListFilter } from './page.repository';
import type { PageDocument } from './page.schema';
import type { CreatePageInput, PageId, UpdatePageInput, UpdatePageSlugInput } from './page.types';

@Injectable()
export class PageService {
  constructor(private readonly pageRepository: PageRepository) {}

  findById(id: PageId): Promise<PageDocument | null> {
    return this.pageRepository.findById(id);
  }

  findBySlug(slugNormalized: string): Promise<PageDocument | null> {
    return this.pageRepository.findBySlug(slugNormalized);
  }

  findPublishedBySlug(slugNormalized: string): Promise<PageDocument | null> {
    return this.pageRepository.findPublishedBySlug(slugNormalized);
  }

  list(
    filter: PageListFilter,
    page: number,
    limit: number,
  ): Promise<{ items: PageDocument[]; total: number }> {
    return this.pageRepository.list(filter, page, limit);
  }

  async isSlugTaken(slugNormalized: string, excludeId?: PageId): Promise<boolean> {
    const existing = await this.pageRepository.existsBySlug(slugNormalized, excludeId);
    return existing !== null;
  }

  async create(input: CreatePageInput): Promise<PageDocument> {
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
      throw new ConflictException(`Slug "${input.slug}" is already taken.`);
    }

    return this.pageRepository.create({ ...input, slugNormalized });
  }

  update(id: PageId, input: UpdatePageInput): Promise<PageDocument | null> {
    return this.pageRepository.update(id, input);
  }

  async updateSlug(id: PageId, input: UpdatePageSlugInput): Promise<PageDocument> {
    const page = await this.pageRepository.findById(id);
    if (!page) {
      throw new NotFoundException('Page not found.');
    }

    let slugNormalized: string;
    try {
      slugNormalized = normalizeSlug(input.slug);
    } catch (err) {
      if (err instanceof SlugPolicyError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }

    if (slugNormalized === page.slugNormalized) {
      return page;
    }

    const taken = await this.isSlugTaken(slugNormalized, id);
    if (taken) {
      throw new ConflictException(`Slug "${input.slug}" is already taken.`);
    }

    const updated = await this.pageRepository.updateSlug(
      id,
      { slug: input.slug, slugNormalized },
      page.slugNormalized,
    );
    return updated!;
  }

  validateStatus(status: string): asserts status is ContentStatus {
    if (!isValidContentStatus(status)) {
      throw new ConflictException(
        `Invalid content status: "${status}". Must be one of: draft, published, archived.`,
      );
    }
  }

  async markPublished(id: PageId): Promise<PageDocument> {
    const updated = await this.pageRepository.markPublished(id, new Date());
    if (!updated) {
      throw new NotFoundException('Page not found.');
    }
    return updated;
  }

  async markArchived(id: PageId): Promise<PageDocument> {
    const updated = await this.pageRepository.markArchived(id);
    if (!updated) {
      throw new NotFoundException('Page not found.');
    }
    return updated;
  }

  async softDelete(id: PageId): Promise<PageDocument> {
    const updated = await this.pageRepository.softDelete(id);
    if (!updated) {
      throw new NotFoundException('Page not found.');
    }
    return updated;
  }
}
