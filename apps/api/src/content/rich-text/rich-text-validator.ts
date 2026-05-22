import { Injectable } from '@nestjs/common';

export interface RichTextValidationError {
  readonly message: string;
  readonly path: string;
}

export interface RichTextValidationResult {
  readonly valid: boolean;
  readonly errors: readonly RichTextValidationError[];
}

const ALLOWED_NODES = new Set<string>([
  'doc',
  'paragraph',
  'heading',
  'text',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'horizontalRule',
  'hardBreak',
  'table',
  'tableRow',
  'tableHeader',
  'tableCell',
]);

const ALLOWED_MARKS = new Set<string>(['bold', 'italic', 'underline', 'strike', 'code', 'link']);

const ALLOWED_HEADING_LEVELS = new Set<number>([1, 2, 3, 4, 5, 6]);

const SAFE_URL_SCHEMES = new Set<string>(['http:', 'https:', 'mailto:']);

const MAX_DEPTH = 12;
const MAX_NODES = 2000;
const MAX_ERRORS = 20;

@Injectable()
export class RichTextValidator {
  validate(doc: unknown): RichTextValidationResult {
    const errors: RichTextValidationError[] = [];
    const ctx = { count: 0 };
    this.validateNode(doc, 'doc', 0, errors, ctx);
    return { valid: errors.length === 0, errors };
  }

  private validateNode(
    node: unknown,
    path: string,
    depth: number,
    errors: RichTextValidationError[],
    ctx: { count: number },
  ): void {
    if (errors.length >= MAX_ERRORS) return;

    if (depth > MAX_DEPTH) {
      errors.push({ message: 'Document exceeds maximum nesting depth.', path });
      return;
    }

    ctx.count++;
    if (ctx.count > MAX_NODES) {
      errors.push({ message: 'Document exceeds maximum node count.', path });
      return;
    }

    if (typeof node !== 'object' || node === null || Array.isArray(node)) {
      errors.push({ message: 'Node must be a plain object.', path });
      return;
    }

    const n = node as Record<string, unknown>;

    if (typeof n.type !== 'string' || n.type.trim() === '') {
      errors.push({ message: 'Node must have a non-empty string type.', path });
      return;
    }

    const t = n.type;

    if (t === 'image') {
      errors.push({
        message:
          'Image nodes are not allowed. Image insertion is disabled until a safe Media API is available.',
        path,
      });
      return;
    }

    if (t === 'embed' || t === 'iframe' || t === 'video' || t === 'audio') {
      errors.push({ message: `Node type "${t}" is not allowed.`, path });
      return;
    }

    if (!ALLOWED_NODES.has(t)) {
      errors.push({ message: `Unknown node type: "${t}".`, path });
      return;
    }

    if (t === 'heading') {
      const attrs = n.attrs as Record<string, unknown> | undefined;
      if (!attrs || typeof attrs.level !== 'number' || !ALLOWED_HEADING_LEVELS.has(attrs.level)) {
        errors.push({ message: 'Heading node must have a level attribute of 1–6.', path });
      }
    }

    if (t === 'text') {
      if (typeof n.text !== 'string') {
        errors.push({ message: 'Text node must have a string "text" field.', path });
      }
      if (n.marks !== undefined) {
        if (!Array.isArray(n.marks)) {
          errors.push({ message: '"marks" must be an array.', path });
        } else {
          (n.marks as unknown[]).forEach((m, i) =>
            this.validateMark(m, `${path}.marks[${i}]`, errors),
          );
        }
      }
    }

    if (n.content !== undefined) {
      if (!Array.isArray(n.content)) {
        errors.push({ message: '"content" must be an array.', path });
      } else {
        (n.content as unknown[]).forEach((child, i) =>
          this.validateNode(child, `${path}.content[${i}]`, depth + 1, errors, ctx),
        );
      }
    }
  }

  private validateMark(mark: unknown, path: string, errors: RichTextValidationError[]): void {
    if (typeof mark !== 'object' || mark === null || Array.isArray(mark)) {
      errors.push({ message: 'Mark must be a plain object.', path });
      return;
    }

    const m = mark as Record<string, unknown>;

    if (typeof m.type !== 'string') {
      errors.push({ message: 'Mark must have a string type.', path });
      return;
    }

    if (!ALLOWED_MARKS.has(m.type)) {
      errors.push({ message: `Unknown mark type: "${m.type}".`, path });
      return;
    }

    if (m.type === 'link') {
      const attrs = m.attrs as Record<string, unknown> | undefined;
      if (!attrs || typeof attrs.href !== 'string') {
        errors.push({ message: 'Link mark must have a string href attribute.', path });
        return;
      }
      if (!this.isSafeUrl(attrs.href)) {
        errors.push({ message: 'Unsafe or disallowed URL in link href.', path });
      }
    }
  }

  isSafeUrl(url: string): boolean {
    if (typeof url !== 'string' || url.trim().length === 0) return false;
    const trimmed = url.trim();

    if (/^\s*javascript\s*:/i.test(trimmed)) return false;
    if (/^\s*data\s*:/i.test(trimmed)) return false;
    if (/^\s*vbscript\s*:/i.test(trimmed)) return false;

    if (trimmed.startsWith('//')) return false;

    if (trimmed.startsWith('#')) return true;
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;

    try {
      const parsed = new URL(trimmed);
      return SAFE_URL_SCHEMES.has(parsed.protocol);
    } catch {
      return false;
    }
  }
}
