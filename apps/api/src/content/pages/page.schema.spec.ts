import { PageSchema } from './page.schema';

describe('Page schema — field definitions', () => {
  it('includes title field', () => {
    expect(PageSchema.path('title')).toBeDefined();
  });

  it('includes slug field', () => {
    expect(PageSchema.path('slug')).toBeDefined();
  });

  it('includes slugNormalized field', () => {
    expect(PageSchema.path('slugNormalized')).toBeDefined();
  });

  it('includes slugHistory array field', () => {
    expect(PageSchema.path('slugHistory')).toBeDefined();
  });

  it('includes bodyJson field', () => {
    expect(PageSchema.path('bodyJson')).toBeDefined();
  });

  it('includes bodyHtml field', () => {
    expect(PageSchema.path('bodyHtml')).toBeDefined();
  });

  it('includes status field', () => {
    expect(PageSchema.path('status')).toBeDefined();
  });

  it('includes seo nested object', () => {
    expect(PageSchema.path('seo')).toBeDefined();
  });

  it('includes createdBy field', () => {
    expect(PageSchema.path('createdBy')).toBeDefined();
  });

  it('includes updatedBy field', () => {
    expect(PageSchema.path('updatedBy')).toBeDefined();
  });

  it('includes publishedAt field', () => {
    expect(PageSchema.path('publishedAt')).toBeDefined();
  });

  it('includes deletedAt field for soft delete', () => {
    expect(PageSchema.path('deletedAt')).toBeDefined();
  });

  it('status defaults to draft', () => {
    const path = PageSchema.path('status') as { defaultValue?: unknown };
    expect(path.defaultValue).toBe('draft');
  });
});

describe('Page schema — index declarations', () => {
  it('declares unique index on slugNormalized', () => {
    const indexes = PageSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([[{ slugNormalized: 1 }, expect.objectContaining({ unique: true })]]),
    );
  });

  it('declares index on status', () => {
    const indexes = PageSchema.indexes();
    expect(indexes).toEqual(expect.arrayContaining([[{ status: 1 }, expect.any(Object)]]));
  });

  it('declares index on createdAt', () => {
    const indexes = PageSchema.indexes();
    expect(indexes).toEqual(expect.arrayContaining([[{ createdAt: 1 }, expect.any(Object)]]));
  });
});
