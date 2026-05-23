import { MediaAssetSchema } from './media-asset.schema';

describe('MediaAssetSchema', () => {
  it('has the required fields defined in the schema', () => {
    const paths = MediaAssetSchema.paths;
    const requiredFields = [
      'originalName',
      'fileName',
      'mimeType',
      'extension',
      'sizeBytes',
      'storageProvider',
      'bucket',
      'objectKey',
      'visibility',
      'variants',
      'uploadedBy',
      'status',
    ];
    for (const field of requiredFields) {
      expect(paths[field]).toBeDefined();
    }
  });

  it('has optional fields defined', () => {
    const paths = MediaAssetSchema.paths;
    expect(paths['width']).toBeDefined();
    expect(paths['height']).toBeDefined();
    expect(paths['alt']).toBeDefined();
    expect(paths['caption']).toBeDefined();
    expect(paths['checksum']).toBeDefined();
    expect(paths['deletedAt']).toBeDefined();
  });

  it('has required indexes defined', () => {
    const indexes = MediaAssetSchema.indexes();
    const indexKeys = indexes.map((idx) => JSON.stringify(idx[0]));
    expect(indexKeys.some((k) => k.includes('uploadedBy'))).toBe(true);
    expect(indexKeys.some((k) => k.includes('status'))).toBe(true);
    expect(indexKeys.some((k) => k.includes('visibility'))).toBe(true);
    expect(indexKeys.some((k) => k.includes('mimeType'))).toBe(true);
    expect(indexKeys.some((k) => k.includes('createdAt'))).toBe(true);
    expect(indexKeys.some((k) => k.includes('checksum'))).toBe(true);
  });

  it('defaults visibility to public', () => {
    const paths = MediaAssetSchema.paths;
    const visibilityPath = paths['visibility'] as { defaultValue?: string };
    expect(visibilityPath.defaultValue).toBe('public');
  });

  it('defaults status to uploaded', () => {
    const paths = MediaAssetSchema.paths;
    const statusPath = paths['status'] as { defaultValue?: string };
    expect(statusPath.defaultValue).toBe('uploaded');
  });
});
