export const CONTENT_POST_TYPES = ['news', 'article', 'announcement', 'guide', 'rule'] as const;
export type ContentPostType = (typeof CONTENT_POST_TYPES)[number];

export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_MEDIA_USAGES = ['cover', 'inline', 'attachment'] as const;
export type ContentMediaUsage = (typeof CONTENT_MEDIA_USAGES)[number];

export const CONTENT_MEDIA_ALIGNMENTS = ['left', 'center', 'right', 'full'] as const;
export type ContentMediaAlignment = (typeof CONTENT_MEDIA_ALIGNMENTS)[number];

export const CONTENT_RESOURCE_TYPES = ['post', 'page'] as const;
export type ContentResourceType = (typeof CONTENT_RESOURCE_TYPES)[number];
