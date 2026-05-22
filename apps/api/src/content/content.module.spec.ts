import { ContentModule } from './content.module';
import { PublicNewsController } from './public/public-news.controller';
import { PublicArticlesController } from './public/public-articles.controller';
import { PublicAnnouncementsController } from './public/public-announcements.controller';
import { PublicGuidesController } from './public/public-guides.controller';
import { PublicRulesController } from './public/public-rules.controller';
import { PublicPagesController } from './public/public-pages.controller';
import { PublicCategoriesController } from './public/public-categories.controller';
import { PublicTagsController } from './public/public-tags.controller';

describe('ContentModule', () => {
  it('registers all 8 public controllers', () => {
    const controllers: unknown[] = Reflect.getMetadata('controllers', ContentModule) ?? [];
    expect(Array.isArray(controllers)).toBe(true);
    expect(controllers).toContain(PublicNewsController);
    expect(controllers).toContain(PublicArticlesController);
    expect(controllers).toContain(PublicAnnouncementsController);
    expect(controllers).toContain(PublicGuidesController);
    expect(controllers).toContain(PublicRulesController);
    expect(controllers).toContain(PublicPagesController);
    expect(controllers).toContain(PublicCategoriesController);
    expect(controllers).toContain(PublicTagsController);
    expect(controllers).toHaveLength(8);
  });
});
