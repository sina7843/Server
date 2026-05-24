import type { Types } from 'mongoose';
import type { ContentPostType, ContentStatus } from '@dragon/types';

export type PostId = Types.ObjectId | string;

export interface PostSeoData {
  readonly title?: string;
  readonly description?: string;
  readonly canonicalUrl?: string;
  readonly noIndex?: boolean;
  readonly ogImageMediaId?: Types.ObjectId;
}

export interface PostMediaRefData {
  readonly mediaId: Types.ObjectId;
  readonly usage: 'cover' | 'inline' | 'attachment';
  readonly alt?: string;
  readonly caption?: string;
  readonly alignment?: 'left' | 'center' | 'right' | 'full';
}

export interface CreatePostInput {
  readonly type: ContentPostType;
  readonly title: string;
  readonly slug: string;
  readonly slugNormalized: string;
  readonly excerpt?: string;
  readonly bodyJson?: Record<string, unknown>;
  readonly bodyHtml?: string;
  readonly authorId: Types.ObjectId | string;
  readonly status?: ContentStatus;
  readonly seo?: Partial<PostSeoData>;
  readonly categoryIds?: Array<Types.ObjectId | string>;
  readonly tagIds?: Array<Types.ObjectId | string>;
  readonly mediaRefs?: PostMediaRefData[];
}

export interface UpdatePostInput {
  readonly title?: string;
  readonly excerpt?: string;
  readonly bodyJson?: Record<string, unknown>;
  readonly bodyHtml?: string;
  readonly seo?: Partial<PostSeoData>;
  readonly categoryIds?: Array<Types.ObjectId | string>;
  readonly tagIds?: Array<Types.ObjectId | string>;
  readonly coverMediaId?: string | null;
  readonly mediaRefs?: PostMediaRefData[];
}

export interface UpdatePostSlugInput {
  readonly slug: string;
  readonly slugNormalized: string;
}
