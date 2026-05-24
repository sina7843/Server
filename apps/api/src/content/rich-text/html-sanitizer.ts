import { Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'strike',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'a',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'span',
  'img',
];

@Injectable()
export class HtmlSanitizer {
  sanitize(html: string): string {
    if (typeof html !== 'string') return '';

    return sanitizeHtml(html, {
      allowedTags: ALLOWED_TAGS,
      allowedAttributes: {
        a: ['href', 'title', 'rel', 'target'],
        code: ['class'],
        pre: ['class'],
        th: ['colspan', 'rowspan', 'scope'],
        td: ['colspan', 'rowspan'],
        span: ['class'],
        img: ['src', 'alt', 'title', 'data-media-id', 'data-alignment', 'class'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      allowedSchemesByTag: {
        a: ['http', 'https', 'mailto'],
        img: ['http', 'https'],
      },
      allowProtocolRelative: false,
      nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript'],
      transformTags: {
        a: (_tagName: string, attribs: { [key: string]: string }) => {
          const href = typeof attribs.href === 'string' ? attribs.href : '';

          // Belt-and-suspenders: strip javascript: and data: even if they passed scheme filter
          if (/^\s*javascript\s*:/i.test(href) || /^\s*data\s*:/i.test(href)) {
            return { tagName: 'span', attribs: {} };
          }

          const out: Record<string, string> = {};
          if (attribs.href) out.href = attribs.href;
          if (attribs.title) out.title = attribs.title;

          // Add safety rel when opening in new tab
          if (attribs.target === '_blank') {
            out.target = '_blank';
            out.rel = 'noopener noreferrer';
          }

          return { tagName: 'a', attribs: out };
        },
        img: (_tagName: string, attribs: { [key: string]: string }) => {
          const src = typeof attribs.src === 'string' ? attribs.src.trim() : '';

          // Strip any img whose src is not a safe absolute http/https URL
          if (!src || /^\s*javascript\s*:/i.test(src) || /^\s*data\s*:/i.test(src)) {
            return { tagName: 'span', attribs: {} };
          }
          try {
            const parsed = new URL(src);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
              return { tagName: 'span', attribs: {} };
            }
          } catch {
            return { tagName: 'span', attribs: {} };
          }

          const out: Record<string, string> = { src };
          if (attribs.alt) out.alt = attribs.alt;
          if (attribs.title) out.title = attribs.title;
          if (attribs['data-media-id']) out['data-media-id'] = attribs['data-media-id'];
          if (attribs['data-alignment']) out['data-alignment'] = attribs['data-alignment'];
          if (attribs.class) out.class = attribs.class;

          return { tagName: 'img', attribs: out };
        },
      },
      disallowedTagsMode: 'discard',
    });
  }
}
