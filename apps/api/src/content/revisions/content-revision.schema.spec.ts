import { ContentRevisionSchema } from './content-revision.schema';

describe('ContentRevision schema — field definitions', () => {
  it('includes resourceType field', () => {
    expect(ContentRevisionSchema.path('resourceType')).toBeDefined();
  });

  it('includes resourceId field', () => {
    expect(ContentRevisionSchema.path('resourceId')).toBeDefined();
  });

  it('includes revisionNumber field', () => {
    expect(ContentRevisionSchema.path('revisionNumber')).toBeDefined();
  });

  it('includes snapshot field', () => {
    expect(ContentRevisionSchema.path('snapshot')).toBeDefined();
  });

  it('includes createdBy field', () => {
    expect(ContentRevisionSchema.path('createdBy')).toBeDefined();
  });

  it('does not include updatedAt (immutable revisions)', () => {
    expect(ContentRevisionSchema.path('updatedAt')).toBeUndefined();
  });
});

describe('ContentRevision schema — index declarations', () => {
  it('declares unique index on resourceType + resourceId + revisionNumber', () => {
    const indexes = ContentRevisionSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([
        [
          { resourceType: 1, resourceId: 1, revisionNumber: 1 },
          expect.objectContaining({ unique: true }),
        ],
      ]),
    );
  });

  it('declares index on resourceType + resourceId + createdAt', () => {
    const indexes = ContentRevisionSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ resourceType: 1, resourceId: 1, createdAt: -1 }, expect.any(Object)],
      ]),
    );
  });
});
