import type { Types } from 'mongoose';
import type { ContentStatus } from '@dragon/types';

export type PageId = Types.ObjectId | string;

export interface PageSeoData {
  readonly title?: string;
  readonly description?: string;
  readonly canonicalUrl?: string;
  readonly noIndex?: boolean;
  readonly ogImageMediaId?: Types.ObjectId;
}

export interface CreatePageInput {
  readonly title: string;
  readonly slug: string;
  readonly slugNormalized: string;
  readonly bodyJson?: Record<string, unknown>;
  readonly bodyHtml?: string;
  readonly createdBy: Types.ObjectId | string;
  readonly status?: ContentStatus;
  readonly seo?: Partial<PageSeoData>;
}

export interface UpdatePageInput {
  readonly title?: string;
  readonly bodyJson?: Record<string, unknown>;
  readonly bodyHtml?: string;
  readonly seo?: Partial<PageSeoData>;
  readonly updatedBy?: Types.ObjectId | string;
}

export interface UpdatePageSlugInput {
  readonly slug: string;
  readonly slugNormalized: string;
}
