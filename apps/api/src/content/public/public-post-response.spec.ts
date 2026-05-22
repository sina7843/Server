import { toPublicPostDto } from './dto/public-post-response';
import type { PostDocument } from '../posts/post.schema';

function makePost(overrides: Partial<Record<string, unknown>> = {}): PostDocument {
  return {
    _id: 'post1',
    type: 'news',
    title: 'Title',
    slug: 'my-post',
    bodyHtml: '<p>sanitized content</p>',
    categoryIds: [],
    tagIds: [],
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    seo: {},
    ...overrides,
  } as unknown as PostDocument;
}

describe('toPublicPostDto', () => {
  it('returns bodyHtml as-is from stored document (sanitization guaranteed at write time)', () => {
    const post = makePost({ bodyHtml: '<p>sanitized content</p>' });
    const dto = toPublicPostDto(post);
    expect(dto.bodyHtml).toBe('<p>sanitized content</p>');
  });

  it('returns empty string for null/undefined bodyHtml', () => {
    const post = makePost({ bodyHtml: undefined });
    const dto = toPublicPostDto(post);
    expect(dto.bodyHtml).toBe('');
  });

  it('does not include bodyJson (raw editor state not exposed publicly)', () => {
    const post = makePost({ bodyJson: { type: 'doc', content: [] } });
    const dto = toPublicPostDto(post);
    expect((dto as unknown as Record<string, unknown>).bodyJson).toBeUndefined();
  });

  it('does not include authorId (internal field not exposed publicly)', () => {
    const post = makePost({ authorId: 'user123' });
    const dto = toPublicPostDto(post);
    expect((dto as unknown as Record<string, unknown>).authorId).toBeUndefined();
  });

  it('does not include slugHistory', () => {
    const post = makePost({ slugHistory: ['old-slug'] });
    const dto = toPublicPostDto(post);
    expect((dto as unknown as Record<string, unknown>).slugHistory).toBeUndefined();
  });

  it('does not include deletedAt', () => {
    const post = makePost({ deletedAt: new Date() });
    const dto = toPublicPostDto(post);
    expect((dto as unknown as Record<string, unknown>).deletedAt).toBeUndefined();
  });
});
