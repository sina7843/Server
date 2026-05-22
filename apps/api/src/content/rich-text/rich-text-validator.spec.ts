import { RichTextValidator } from './rich-text-validator';

describe('RichTextValidator', () => {
  let validator: RichTextValidator;

  beforeEach(() => {
    validator = new RichTextValidator();
  });

  // ─── Accepted nodes ──────────────────────────────────────────────────────────

  it('accepts a valid empty doc node', () => {
    const result = validator.validate({ type: 'doc', content: [] });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts paragraph nodes', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts heading nodes within allowed levels (1–6)', () => {
    for (const level of [1, 2, 3, 4, 5, 6]) {
      const result = validator.validate({
        type: 'doc',
        content: [{ type: 'heading', attrs: { level }, content: [{ type: 'text', text: 'Hi' }] }],
      });
      expect(result.valid).toBe(true);
    }
  });

  it('rejects heading with invalid level', () => {
    const result = validator.validate({
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 7 } }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toMatch(/level/i);
  });

  it('accepts bold and italic marks', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'Italic', marks: [{ type: 'italic' }] },
          ],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts underline, strike, and code marks', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'U', marks: [{ type: 'underline' }] },
            { type: 'text', text: 'S', marks: [{ type: 'strike' }] },
            { type: 'text', text: 'C', marks: [{ type: 'code' }] },
          ],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts ordered and unordered lists', () => {
    const listItem = {
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item' }] }],
    };
    const bullet = validator.validate({
      type: 'doc',
      content: [{ type: 'bulletList', content: [listItem] }],
    });
    const ordered = validator.validate({
      type: 'doc',
      content: [{ type: 'orderedList', content: [listItem] }],
    });
    expect(bullet.valid).toBe(true);
    expect(ordered.valid).toBe(true);
  });

  it('accepts blockquote', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quote' }] }],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts code block', () => {
    const result = validator.validate({
      type: 'doc',
      content: [{ type: 'codeBlock', content: [{ type: 'text', text: 'const x = 1;' }] }],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts simple table structure', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableHeader',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H1' }] }],
                },
                {
                  type: 'tableHeader',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H2' }] }],
                },
              ],
            },
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }],
                },
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'B' }] }],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts link mark with safe https URL', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Link',
              marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
            },
          ],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts link mark with http URL', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'L',
              marks: [{ type: 'link', attrs: { href: 'http://example.com' } }],
            },
          ],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts link mark with mailto URL', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'L',
              marks: [{ type: 'link', attrs: { href: 'mailto:user@example.com' } }],
            },
          ],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts link mark with root-relative URL', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'L', marks: [{ type: 'link', attrs: { href: '/about' } }] },
          ],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts link mark with anchor fragment', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'L', marks: [{ type: 'link', attrs: { href: '#section-1' } }] },
          ],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  // ─── Rejected nodes ──────────────────────────────────────────────────────────

  it('rejects unknown node types', () => {
    const result = validator.validate({
      type: 'doc',
      content: [{ type: 'customBlock' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Unknown node type'))).toBe(true);
  });

  it('rejects unknown mark types', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'x', marks: [{ type: 'highlight' }] }],
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Unknown mark type'))).toBe(true);
  });

  it('rejects image nodes (no safe image policy yet)', () => {
    const result = validator.validate({
      type: 'doc',
      content: [{ type: 'image', attrs: { src: 'https://example.com/img.jpg' } }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.toLowerCase().includes('image'))).toBe(true);
  });

  it('rejects embed nodes', () => {
    const result = validator.validate({ type: 'doc', content: [{ type: 'embed' }] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('not allowed'))).toBe(true);
  });

  it('rejects iframe nodes', () => {
    const result = validator.validate({ type: 'doc', content: [{ type: 'iframe' }] });
    expect(result.valid).toBe(false);
  });

  it('rejects video nodes', () => {
    const result = validator.validate({ type: 'doc', content: [{ type: 'video' }] });
    expect(result.valid).toBe(false);
  });

  // ─── Unsafe link href ────────────────────────────────────────────────────────

  it('rejects javascript: link href', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.toLowerCase().includes('unsafe'))).toBe(true);
  });

  it('rejects data: link href', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [
                { type: 'link', attrs: { href: 'data:text/html,<script>alert(1)</script>' } },
              ],
            },
          ],
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects vbscript: link href', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'link', attrs: { href: 'vbscript:MsgBox(1)' } }],
            },
          ],
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects protocol-relative link href', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: '//evil.com' } }] },
          ],
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects ftp: link href', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'link', attrs: { href: 'ftp://example.com' } }],
            },
          ],
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  // ─── isSafeUrl standalone tests ──────────────────────────────────────────────

  describe('isSafeUrl', () => {
    it('allows https URLs', () => {
      expect(validator.isSafeUrl('https://example.com')).toBe(true);
    });

    it('allows http URLs', () => {
      expect(validator.isSafeUrl('http://example.com')).toBe(true);
    });

    it('allows mailto URLs', () => {
      expect(validator.isSafeUrl('mailto:a@b.com')).toBe(true);
    });

    it('allows root-relative paths', () => {
      expect(validator.isSafeUrl('/page/slug')).toBe(true);
    });

    it('allows anchor fragments', () => {
      expect(validator.isSafeUrl('#section')).toBe(true);
    });

    it('rejects javascript: (case-insensitive)', () => {
      expect(validator.isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(validator.isSafeUrl('JAVASCRIPT:alert(1)')).toBe(false);
      expect(validator.isSafeUrl('Javascript:alert(1)')).toBe(false);
    });

    it('rejects data: URLs', () => {
      expect(validator.isSafeUrl('data:text/html,<h1>x</h1>')).toBe(false);
    });

    it('rejects vbscript: URLs', () => {
      expect(validator.isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    });

    it('rejects protocol-relative URLs', () => {
      expect(validator.isSafeUrl('//evil.com')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validator.isSafeUrl('')).toBe(false);
    });

    it('rejects malformed URLs that are not relative', () => {
      expect(validator.isSafeUrl('not a url at all !')).toBe(false);
    });
  });

  // ─── Structural edge cases ───────────────────────────────────────────────────

  it('rejects non-object node', () => {
    const result = validator.validate({ type: 'doc', content: ['not an object'] });
    expect(result.valid).toBe(false);
  });

  it('rejects node with missing type', () => {
    const result = validator.validate({ type: 'doc', content: [{ content: [] }] });
    expect(result.valid).toBe(false);
  });

  it('rejects text node with non-string text field', () => {
    const result = validator.validate({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 42 }] }],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects link mark without href', () => {
    const result = validator.validate({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: {} }] }],
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('href'))).toBe(true);
  });
});
