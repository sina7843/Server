import { BadRequestException } from '@nestjs/common';
import { parseAdminCreatePostBody, parseAdminUpdatePostBody } from './admin-post-body';

const BASE = {
  type: 'news',
  title: 'Test Post',
  slug: 'test-post',
  bodyJson: {},
  bodyHtml: '<p>hello</p>',
  categoryIds: [],
  tagIds: [],
  seo: {},
};

describe('parseAdminCreatePostBody — coverMediaId', () => {
  it('accepts a valid 24-char hex ObjectId as coverMediaId', () => {
    const result = parseAdminCreatePostBody({ ...BASE, coverMediaId: 'a'.repeat(24) });
    expect(result.coverMediaId).toBe('a'.repeat(24));
  });

  it('accepts null coverMediaId', () => {
    const result = parseAdminCreatePostBody({ ...BASE, coverMediaId: null });
    expect(result.coverMediaId).toBeNull();
  });

  it('treats empty string coverMediaId as null', () => {
    const result = parseAdminCreatePostBody({ ...BASE, coverMediaId: '' });
    expect(result.coverMediaId).toBeNull();
  });

  it('rejects coverMediaId that is too short', () => {
    expect(() => parseAdminCreatePostBody({ ...BASE, coverMediaId: 'abc123' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects coverMediaId with non-hex characters', () => {
    expect(() => parseAdminCreatePostBody({ ...BASE, coverMediaId: 'z'.repeat(24) })).toThrow(
      BadRequestException,
    );
  });

  it('rejects coverMediaId that is a number', () => {
    expect(() => parseAdminCreatePostBody({ ...BASE, coverMediaId: 12345 })).toThrow(
      BadRequestException,
    );
  });

  it('omits coverMediaId from result when not provided', () => {
    const result = parseAdminCreatePostBody({ ...BASE });
    expect(Object.prototype.hasOwnProperty.call(result, 'coverMediaId')).toBe(false);
  });

  it('rejects unknown field alongside coverMediaId', () => {
    expect(() => parseAdminCreatePostBody({ ...BASE, unknownField: 'value' })).toThrow(
      BadRequestException,
    );
  });
});

describe('parseAdminUpdatePostBody — coverMediaId', () => {
  it('accepts a valid 24-char hex ObjectId as coverMediaId', () => {
    const result = parseAdminUpdatePostBody({ coverMediaId: 'a'.repeat(24) });
    expect(result.coverMediaId).toBe('a'.repeat(24));
  });

  it('accepts null coverMediaId', () => {
    const result = parseAdminUpdatePostBody({ coverMediaId: null });
    expect(result.coverMediaId).toBeNull();
  });

  it('treats empty string coverMediaId as null', () => {
    const result = parseAdminUpdatePostBody({ coverMediaId: '' });
    expect(result.coverMediaId).toBeNull();
  });

  it('rejects coverMediaId that is too short', () => {
    expect(() => parseAdminUpdatePostBody({ coverMediaId: 'abc123' })).toThrow(BadRequestException);
  });

  it('rejects coverMediaId with non-hex characters', () => {
    expect(() => parseAdminUpdatePostBody({ coverMediaId: 'z'.repeat(24) })).toThrow(
      BadRequestException,
    );
  });

  it('rejects coverMediaId that is a number', () => {
    expect(() => parseAdminUpdatePostBody({ coverMediaId: 12345 })).toThrow(BadRequestException);
  });

  it('omits coverMediaId from result when not provided', () => {
    const result = parseAdminUpdatePostBody({ title: 'New Title' });
    expect(Object.prototype.hasOwnProperty.call(result, 'coverMediaId')).toBe(false);
  });
});
