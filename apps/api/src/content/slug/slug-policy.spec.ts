import { normalizeSlug, SlugPolicyError } from './slug-policy';

describe('normalizeSlug — post slug normalization', () => {
  it('returns input unchanged when already normalized', () => {
    expect(normalizeSlug('my-post')).toBe('my-post');
  });

  it('lowercases uppercase input', () => {
    expect(normalizeSlug('My-Post')).toBe('my-post');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeSlug('  my-post  ')).toBe('my-post');
  });

  it('collapses internal whitespace to a single hyphen', () => {
    expect(normalizeSlug('my post')).toBe('my-post');
  });

  it('collapses multiple hyphens to one', () => {
    expect(normalizeSlug('my--post')).toBe('my-post');
  });

  it('is deterministic — same input always yields same output', () => {
    const input = 'Hello World';
    expect(normalizeSlug(input)).toBe(normalizeSlug(input));
  });

  it('handles numeric slugs', () => {
    expect(normalizeSlug('2024')).toBe('2024');
  });

  it('handles alphanumeric slugs', () => {
    expect(normalizeSlug('post-2024-edition')).toBe('post-2024-edition');
  });
});

describe('normalizeSlug — page slug normalization', () => {
  it('normalizes page slugs deterministically', () => {
    const result = normalizeSlug('about-us');
    expect(result).toBe('about-us');
  });

  it('lowercases and trims page slugs', () => {
    expect(normalizeSlug('  About Us  ')).toBe('about-us');
  });
});

describe('normalizeSlug — unsafe slug rejection', () => {
  it('rejects slugs with forward slashes', () => {
    expect(() => normalizeSlug('my/post')).toThrow(SlugPolicyError);
  });

  it('rejects slugs with query string characters', () => {
    expect(() => normalizeSlug('my?q=1')).toThrow(SlugPolicyError);
  });

  it('rejects slugs with hash characters', () => {
    expect(() => normalizeSlug('my#section')).toThrow(SlugPolicyError);
  });

  it('rejects slugs with square brackets', () => {
    expect(() => normalizeSlug('my[post]')).toThrow(SlugPolicyError);
  });

  it('rejects empty string', () => {
    expect(() => normalizeSlug('')).toThrow(SlugPolicyError);
  });

  it('rejects whitespace-only string', () => {
    expect(() => normalizeSlug('   ')).toThrow(SlugPolicyError);
  });

  it('rejects slugs exceeding 200 characters', () => {
    expect(() => normalizeSlug('a'.repeat(201))).toThrow(SlugPolicyError);
  });

  it('rejects slugs that start with a hyphen after normalization', () => {
    expect(() => normalizeSlug('-leading-hyphen')).toThrow(SlugPolicyError);
  });

  it('rejects slugs that end with a hyphen after normalization', () => {
    expect(() => normalizeSlug('trailing-hyphen-')).toThrow(SlugPolicyError);
  });

  it('throws SlugPolicyError with descriptive message for empty input', () => {
    expect(() => normalizeSlug('')).toThrow('Slug must not be empty.');
  });

  it('throws SlugPolicyError with descriptive message for unsafe chars', () => {
    expect(() => normalizeSlug('bad/slug')).toThrow('Slug contains unsafe characters.');
  });

  it('throws SlugPolicyError with descriptive message for length violation', () => {
    expect(() => normalizeSlug('a'.repeat(201))).toThrow('Slug must not exceed 200 characters.');
  });
});
