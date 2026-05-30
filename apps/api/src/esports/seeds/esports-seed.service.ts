import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../../content/categories/category.repository';
import { TagRepository } from '../../content/tags/tag.repository';

export interface EsportsSeedResult {
  readonly categoriesCreated: number;
  readonly categoriesSkipped: number;
  readonly tagsCreated: number;
  readonly tagsSkipped: number;
}

const ESPORTS_CATEGORIES = [
  { name: 'Esports', slug: 'esports', slugNormalized: 'esports', sortOrder: 10 },
  { name: 'Tournaments', slug: 'tournaments', slugNormalized: 'tournaments', sortOrder: 11 },
  { name: 'Game Coverage', slug: 'game-coverage', slugNormalized: 'game-coverage', sortOrder: 12 },
] as const;

const ESPORTS_TAGS = [
  { name: 'Featured', slug: 'featured', slugNormalized: 'featured' },
  { name: 'Breaking News', slug: 'breaking-news', slugNormalized: 'breaking-news' },
  { name: 'Top Content', slug: 'top-content', slugNormalized: 'top-content' },
] as const;

@Injectable()
export class EsportsSeedService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly tagRepository: TagRepository,
  ) {}

  async runEsportsSeed(): Promise<EsportsSeedResult> {
    let categoriesCreated = 0;
    let categoriesSkipped = 0;
    let tagsCreated = 0;
    let tagsSkipped = 0;

    for (const cat of ESPORTS_CATEGORIES) {
      const { created } = await this.categoryRepository.upsertBySlugForSeed(cat);
      if (created) categoriesCreated += 1;
      else categoriesSkipped += 1;
    }

    for (const tag of ESPORTS_TAGS) {
      const { created } = await this.tagRepository.upsertBySlugForSeed(tag);
      if (created) tagsCreated += 1;
      else tagsSkipped += 1;
    }

    return { categoriesCreated, categoriesSkipped, tagsCreated, tagsSkipped };
  }
}
