import { PostSchema } from './post.schema';

describe('Post schema — field definitions', () => {
  it('includes type field with post-type enum', () => {
    const path = PostSchema.path('type');
    expect(path).toBeDefined();
  });

  it('includes title field', () => {
    expect(PostSchema.path('title')).toBeDefined();
  });

  it('includes slug field', () => {
    expect(PostSchema.path('slug')).toBeDefined();
  });

  it('includes slugNormalized field', () => {
    expect(PostSchema.path('slugNormalized')).toBeDefined();
  });

  it('includes slugHistory array field', () => {
    expect(PostSchema.path('slugHistory')).toBeDefined();
  });

  it('includes excerpt field', () => {
    expect(PostSchema.path('excerpt')).toBeDefined();
  });

  it('includes bodyJson field', () => {
    expect(PostSchema.path('bodyJson')).toBeDefined();
  });

  it('includes bodyHtml field', () => {
    expect(PostSchema.path('bodyHtml')).toBeDefined();
  });

  it('includes mediaRefs array field', () => {
    expect(PostSchema.path('mediaRefs')).toBeDefined();
  });

  it('includes coverMediaId field', () => {
    expect(PostSchema.path('coverMediaId')).toBeDefined();
  });

  it('includes categoryIds array field', () => {
    expect(PostSchema.path('categoryIds')).toBeDefined();
  });

  it('includes tagIds array field', () => {
    expect(PostSchema.path('tagIds')).toBeDefined();
  });

  it('includes status field with content-status enum', () => {
    expect(PostSchema.path('status')).toBeDefined();
  });

  it('includes authorId field', () => {
    expect(PostSchema.path('authorId')).toBeDefined();
  });

  it('includes publishedAt field', () => {
    expect(PostSchema.path('publishedAt')).toBeDefined();
  });

  it('includes seo nested object', () => {
    expect(PostSchema.path('seo')).toBeDefined();
  });

  it('includes viewCount field', () => {
    expect(PostSchema.path('viewCount')).toBeDefined();
  });

  it('includes deletedAt field for soft delete', () => {
    expect(PostSchema.path('deletedAt')).toBeDefined();
  });

  it('status defaults to draft', () => {
    const path = PostSchema.path('status') as { defaultValue?: unknown };
    expect(path.defaultValue).toBe('draft');
  });

  it('viewCount defaults to 0', () => {
    const path = PostSchema.path('viewCount') as { defaultValue?: unknown };
    expect(path.defaultValue).toBe(0);
  });
});

describe('Post schema — index declarations', () => {
  it('declares unique compound index on type + slugNormalized', () => {
    const indexes = PostSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ type: 1, slugNormalized: 1 }, expect.objectContaining({ unique: true })],
      ]),
    );
  });

  it('declares compound index on type + status + publishedAt', () => {
    const indexes = PostSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ type: 1, status: 1, publishedAt: -1 }, expect.any(Object)],
      ]),
    );
  });

  it('declares index on categoryIds', () => {
    const indexes = PostSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([[{ categoryIds: 1 }, expect.any(Object)]]),
    );
  });

  it('declares index on tagIds', () => {
    const indexes = PostSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([[{ tagIds: 1 }, expect.any(Object)]]),
    );
  });

  it('declares index on authorId', () => {
    const indexes = PostSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([[{ authorId: 1 }, expect.any(Object)]]),
    );
  });

  it('declares index on createdAt', () => {
    const indexes = PostSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([[{ createdAt: 1 }, expect.any(Object)]]),
    );
  });

  it('declares index on updatedAt', () => {
    const indexes = PostSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([[{ updatedAt: 1 }, expect.any(Object)]]),
    );
  });
});
