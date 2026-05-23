import type { ContentSeoDto } from '@dragon/types';

export interface ContentSeoOptions {
  readonly title: string;
  readonly seo?: ContentSeoDto;
  readonly noIndex?: boolean;
}

export function buildContentSeoHead(opts: ContentSeoOptions) {
  const title = opts.seo?.title || opts.title;
  const description = opts.seo?.description;
  const noIndex = opts.noIndex || opts.seo?.noIndex;

  const meta: Array<{ name?: string; property?: string; content: string }> = [];
  if (description) meta.push({ name: 'description', content: description });
  if (noIndex) meta.push({ name: 'robots', content: 'noindex,follow' });
  if (title && !noIndex) meta.push({ property: 'og:title', content: title });
  if (description && !noIndex) meta.push({ property: 'og:description', content: description });

  const link: Array<{ rel: string; href: string }> = [];
  if (opts.seo?.canonicalUrl) link.push({ rel: 'canonical', href: opts.seo.canonicalUrl });

  return { title, meta, link };
}
