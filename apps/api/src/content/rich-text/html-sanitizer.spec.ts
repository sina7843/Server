import { HtmlSanitizer } from './html-sanitizer';

describe('HtmlSanitizer', () => {
  let sanitizer: HtmlSanitizer;

  beforeEach(() => {
    sanitizer = new HtmlSanitizer();
  });

  // ─── Script / style removal ──────────────────────────────────────────────────

  it('removes script tags and their content', () => {
    const result = sanitizer.sanitize('<script>alert("xss")</script><p>Hello</p>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('<p>Hello</p>');
  });

  it('removes inline script tags', () => {
    const result = sanitizer.sanitize('<p>Text</p><script type="text/javascript">evil()</script>');
    expect(result).not.toContain('evil');
    expect(result).toContain('<p>Text</p>');
  });

  it('removes style tags and their content', () => {
    const result = sanitizer.sanitize('<style>body { display: none; }</style><p>Content</p>');
    expect(result).not.toContain('<style>');
    expect(result).not.toContain('display');
    expect(result).toContain('<p>Content</p>');
  });

  it('removes noscript tags', () => {
    const result = sanitizer.sanitize(
      '<noscript><img src="x" onerror="evil()"></noscript><p>ok</p>',
    );
    expect(result).not.toContain('noscript');
    expect(result).not.toContain('evil');
  });

  // ─── Event handler removal ───────────────────────────────────────────────────

  it('removes onclick event handlers', () => {
    const result = sanitizer.sanitize('<p onclick="alert(1)">Click me</p>');
    expect(result).not.toContain('onclick');
    expect(result).toContain('Click me');
  });

  it('removes onerror event handlers', () => {
    const result = sanitizer.sanitize('<p onerror="evil()">text</p>');
    expect(result).not.toContain('onerror');
  });

  it('removes onload event handlers', () => {
    const result = sanitizer.sanitize('<p onload="evil()">text</p>');
    expect(result).not.toContain('onload');
  });

  it('removes onmouseover event handlers', () => {
    const result = sanitizer.sanitize(
      '<a href="https://example.com" onmouseover="evil()">link</a>',
    );
    expect(result).not.toContain('onmouseover');
    expect(result).toContain('href="https://example.com"');
  });

  // ─── Unsafe link handling ────────────────────────────────────────────────────

  it('blocks javascript: links — converts to span', () => {
    const result = sanitizer.sanitize('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('<a ');
    expect(result).toContain('click');
  });

  it('blocks javascript: links with mixed case', () => {
    const result = sanitizer.sanitize('<a href="JaVaScRiPt:alert(1)">click</a>');
    expect(result).not.toContain('JaVaScRiPt:');
    expect(result).not.toContain('javascript:');
  });

  it('blocks data: URL links', () => {
    const result = sanitizer.sanitize(
      '<a href="data:text/html,<script>alert(1)</script>">click</a>',
    );
    expect(result).not.toContain('data:');
  });

  it('blocks protocol-relative URLs', () => {
    const result = sanitizer.sanitize('<a href="//evil.com/steal-cookies">click</a>');
    expect(result).not.toContain('//evil.com');
  });

  it('preserves valid http links', () => {
    const result = sanitizer.sanitize('<a href="http://example.com">visit</a>');
    expect(result).toContain('href="http://example.com"');
    expect(result).toContain('visit');
  });

  it('preserves valid https links', () => {
    const result = sanitizer.sanitize('<a href="https://example.com/path">visit</a>');
    expect(result).toContain('href="https://example.com/path"');
  });

  it('preserves mailto links', () => {
    const result = sanitizer.sanitize('<a href="mailto:user@example.com">email</a>');
    expect(result).toContain('href="mailto:user@example.com"');
  });

  it('adds rel="noopener noreferrer" when target="_blank"', () => {
    const result = sanitizer.sanitize('<a href="https://example.com" target="_blank">link</a>');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('does not add target or rel when no target="_blank"', () => {
    const result = sanitizer.sanitize('<a href="https://example.com">link</a>');
    expect(result).not.toContain('target');
    expect(result).not.toContain('rel');
  });

  // ─── Unsafe attribute removal ────────────────────────────────────────────────

  it('strips unsafe attributes from allowed tags', () => {
    const result = sanitizer.sanitize('<p id="main" class="text" style="color:red">text</p>');
    expect(result).not.toContain('style=');
    expect(result).not.toContain('id=');
    expect(result).toContain('text');
  });

  it('strips data-* attributes', () => {
    const result = sanitizer.sanitize('<p data-secret="value">text</p>');
    expect(result).not.toContain('data-secret');
  });

  // ─── Preserved allowed content ───────────────────────────────────────────────

  it('preserves paragraphs', () => {
    const result = sanitizer.sanitize('<p>Hello world</p>');
    expect(result).toBe('<p>Hello world</p>');
  });

  it('preserves headings h1–h6', () => {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const result = sanitizer.sanitize(`<h${n}>Title</h${n}>`);
      expect(result).toContain(`<h${n}>Title</h${n}>`);
    }
  });

  it('preserves unordered lists', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = sanitizer.sanitize(html);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item 1</li>');
  });

  it('preserves ordered lists', () => {
    const html = '<ol><li>First</li><li>Second</li></ol>';
    const result = sanitizer.sanitize(html);
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>First</li>');
  });

  it('preserves blockquote', () => {
    const result = sanitizer.sanitize('<blockquote><p>Quote text</p></blockquote>');
    expect(result).toContain('<blockquote>');
    expect(result).toContain('Quote text');
  });

  it('preserves code and pre blocks', () => {
    const result = sanitizer.sanitize('<pre><code class="language-ts">const x = 1;</code></pre>');
    expect(result).toContain('<pre>');
    expect(result).toContain('<code class="language-ts">');
    expect(result).toContain('const x = 1;');
  });

  it('preserves inline bold and italic', () => {
    const result = sanitizer.sanitize('<p><strong>bold</strong> and <em>italic</em></p>');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  it('preserves table structure', () => {
    const html =
      '<table><thead><tr><th>Head</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';
    const result = sanitizer.sanitize(html);
    expect(result).toContain('<table>');
    expect(result).toContain('<thead>');
    expect(result).toContain('<th>Head</th>');
    expect(result).toContain('<td>Cell</td>');
  });

  // ─── Iframe / embed removal ───────────────────────────────────────────────────

  it('removes iframe tags', () => {
    const result = sanitizer.sanitize('<iframe src="https://evil.com"></iframe><p>safe</p>');
    expect(result).not.toContain('<iframe');
    expect(result).toContain('<p>safe</p>');
  });

  it('removes object/embed tags', () => {
    const result = sanitizer.sanitize('<object data="evil.swf"></object><p>ok</p>');
    expect(result).not.toContain('<object');
    expect(result).toContain('<p>ok</p>');
  });

  it('removes img tags (images not yet supported)', () => {
    const result = sanitizer.sanitize(
      '<img src="https://example.com/img.jpg" alt="photo"><p>text</p>',
    );
    expect(result).not.toContain('<img');
    expect(result).toContain('<p>text</p>');
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────────

  it('returns empty string for empty input', () => {
    expect(sanitizer.sanitize('')).toBe('');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizer.sanitize(null as unknown as string)).toBe('');
    expect(sanitizer.sanitize(undefined as unknown as string)).toBe('');
  });

  it('handles deeply nested unsafe injection attempt', () => {
    const result = sanitizer.sanitize(
      '<div><p><span onclick="evil()"><a href="javascript:void(0)">click</a></span></p></div>',
    );
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('javascript:');
    expect(result).toContain('click');
  });

  it('strips unsafe attributes while preserving allowed colspan/rowspan', () => {
    const result = sanitizer.sanitize(
      '<table><tr><td colspan="2" onclick="evil()">cell</td></tr></table>',
    );
    expect(result).toContain('colspan="2"');
    expect(result).not.toContain('onclick');
  });
});
