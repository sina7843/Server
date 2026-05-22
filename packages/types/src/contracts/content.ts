import type {
  ContentMediaAlignment,
  ContentMediaUsage,
  ContentPostType,
  ContentResourceType,
  ContentStatus,
} from '../constants/content';

export interface ContentSeoDto {
  readonly title?: string;
  readonly description?: string;
  readonly canonicalUrl?: string;
  readonly noIndex?: boolean;
  readonly ogImageMediaId?: string;
}

export interface ContentMediaRefDto {
  readonly mediaId: string;
  readonly usage: ContentMediaUsage;
  readonly alt?: string;
  readonly caption?: string;
  readonly alignment?: ContentMediaAlignment;
}

export interface ContentPostSummary {
  readonly id: string;
  readonly type: ContentPostType;
  readonly title: string;
  readonly slug: string;
  readonly excerpt?: string;
  readonly status: ContentStatus;
  readonly authorId: string;
  readonly publishedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ContentPageSummary {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: ContentStatus;
  readonly createdBy: string;
  readonly publishedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ContentCategorySummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly parentId?: string;
  readonly sortOrder: number;
}

export interface ContentTagSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface ContentRevisionSummary {
  readonly id: string;
  readonly resourceType: ContentResourceType;
  readonly resourceId: string;
  readonly revisionNumber: number;
  readonly createdBy: string;
  readonly reason?: string;
  readonly createdAt: string;
}
