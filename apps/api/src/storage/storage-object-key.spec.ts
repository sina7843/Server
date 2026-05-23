import {
  assertSafeObjectKey,
  extensionFromMimeType,
  generateObjectKey,
  normalizeSafeExtension,
} from './storage-object-key';

describe('generateObjectKey', () => {
  it('returns a forward-slash path under the default namespace', () => {
    const key = generateObjectKey();
    expect(key).toMatch(/^media\/original\/\d{4}\/\d{2}\/[0-9a-f]{32}$/);
  });

  it('includes the derived extension when mimeType is given', () => {
    const key = generateObjectKey({ mimeType: 'image/jpeg' });
    expect(key).toMatch(/\.jpg$/);
  });

  it('includes a suffix when provided', () => {
    const key = generateObjectKey({ suffix: 'thumbnail', mimeType: 'image/webp' });
    expect(key).toMatch(/-thumbnail\.webp$/);
  });

  it('uses a custom namespace', () => {
    const key = generateObjectKey({ namespace: 'media/variants' });
    expect(key).toMatch(/^media\/variants\//);
  });

  it('produces different keys on each call (no collision-prone plain names)', () => {
    const a = generateObjectKey();
    const b = generateObjectKey();
    expect(a).not.toBe(b);
  });

  it('does not contain the original file name', () => {
    const key = generateObjectKey({ mimeType: 'image/png' });
    expect(key).not.toContain('original-file');
    expect(key).not.toContain('user-upload');
  });

  it('rejects namespaces with path traversal', () => {
    expect(() => generateObjectKey({ namespace: '../../etc' })).toThrow('disallowed characters');
  });

  it('rejects absolute path namespaces', () => {
    expect(() => generateObjectKey({ namespace: '/absolute' })).toThrow('absolute path');
  });

  it('uses only forward slashes', () => {
    const key = generateObjectKey();
    expect(key).not.toContain('\\');
  });
});

describe('assertSafeObjectKey', () => {
  it('passes for a valid key', () => {
    expect(() => assertSafeObjectKey('media/original/2026/05/abc123.jpg')).not.toThrow();
  });

  it('rejects path traversal with ..', () => {
    expect(() => assertSafeObjectKey('media/../../etc/passwd')).toThrow('disallowed characters');
  });

  it('rejects backslash', () => {
    expect(() => assertSafeObjectKey('media\\file.jpg')).toThrow('disallowed characters');
  });

  it('rejects null byte', () => {
    expect(() => assertSafeObjectKey('media/file\0.jpg')).toThrow('disallowed characters');
  });

  it('rejects absolute paths', () => {
    expect(() => assertSafeObjectKey('/absolute/path.jpg')).toThrow('absolute path');
  });
});

describe('extensionFromMimeType', () => {
  it('maps image/jpeg to jpg', () => {
    expect(extensionFromMimeType('image/jpeg')).toBe('jpg');
  });

  it('returns undefined for unknown mime types', () => {
    expect(extensionFromMimeType('application/x-unknown')).toBeUndefined();
  });
});

describe('normalizeSafeExtension', () => {
  it('strips the leading dot', () => {
    expect(normalizeSafeExtension('.JPG')).toBe('jpg');
  });

  it('rejects path-traversal-style strings', () => {
    expect(normalizeSafeExtension('../bad')).toBeUndefined();
  });

  it('rejects extensions longer than 10 chars', () => {
    expect(normalizeSafeExtension('verylongext')).toBeUndefined();
  });
});
