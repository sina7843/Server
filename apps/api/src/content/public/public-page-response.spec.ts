import { toPublicPageDto } from './dto/public-page-response';
import type { PageDocument } from '../pages/page.schema';

function makePage(overrides: Partial<Record<string, unknown>> = {}): PageDocument {
  return {
    _id: 'page1',
    title: 'About',
    slug: 'about',
    bodyHtml: '<p>sanitized page content</p>',
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    seo: {},
    ...overrides,
  } as unknown as PageDocument;
}

describe('toPublicPageDto', () => {
  it('returns bodyHtml as-is from stored document (sanitization guaranteed at write time)', () => {
    const page = makePage({ bodyHtml: '<p>sanitized page content</p>' });
    const dto = toPublicPageDto(page);
    expect(dto.bodyHtml).toBe('<p>sanitized page content</p>');
  });

  it('returns empty string for null/undefined bodyHtml', () => {
    const page = makePage({ bodyHtml: undefined });
    const dto = toPublicPageDto(page);
    expect(dto.bodyHtml).toBe('');
  });

  it('does not include bodyJson (raw editor state not exposed publicly)', () => {
    const page = makePage({ bodyJson: { type: 'doc', content: [] } });
    const dto = toPublicPageDto(page);
    expect((dto as unknown as Record<string, unknown>).bodyJson).toBeUndefined();
  });

  it('does not include createdBy (internal field not exposed publicly)', () => {
    const page = makePage({ createdBy: 'user123' });
    const dto = toPublicPageDto(page);
    expect((dto as unknown as Record<string, unknown>).createdBy).toBeUndefined();
  });

  it('does not include deletedAt', () => {
    const page = makePage({ deletedAt: new Date() });
    const dto = toPublicPageDto(page);
    expect((dto as unknown as Record<string, unknown>).deletedAt).toBeUndefined();
  });
});
