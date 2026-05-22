import { CategorySchema } from './category.schema';

describe('Category schema — field definitions', () => {
  it('includes name field', () => {
    expect(CategorySchema.path('name')).toBeDefined();
  });

  it('includes slug field', () => {
    expect(CategorySchema.path('slug')).toBeDefined();
  });

  it('includes slugNormalized field', () => {
    expect(CategorySchema.path('slugNormalized')).toBeDefined();
  });

  it('includes description field', () => {
    expect(CategorySchema.path('description')).toBeDefined();
  });

  it('includes parentId field', () => {
    expect(CategorySchema.path('parentId')).toBeDefined();
  });

  it('includes sortOrder field', () => {
    expect(CategorySchema.path('sortOrder')).toBeDefined();
  });

  it('sortOrder defaults to 0', () => {
    const path = CategorySchema.path('sortOrder') as { defaultValue?: unknown };
    expect(path.defaultValue).toBe(0);
  });
});

describe('Category schema — index declarations', () => {
  it('declares unique index on slugNormalized', () => {
    const indexes = CategorySchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([[{ slugNormalized: 1 }, expect.objectContaining({ unique: true })]]),
    );
  });
});
