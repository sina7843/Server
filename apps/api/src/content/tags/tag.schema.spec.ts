import { TagSchema } from './tag.schema';

describe('Tag schema — field definitions', () => {
  it('includes name field', () => {
    expect(TagSchema.path('name')).toBeDefined();
  });

  it('includes slug field', () => {
    expect(TagSchema.path('slug')).toBeDefined();
  });

  it('includes slugNormalized field', () => {
    expect(TagSchema.path('slugNormalized')).toBeDefined();
  });
});

describe('Tag schema — index declarations', () => {
  it('declares unique index on slugNormalized', () => {
    const indexes = TagSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ slugNormalized: 1 }, expect.objectContaining({ unique: true })],
      ]),
    );
  });
});
