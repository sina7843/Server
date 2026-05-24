import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuditAction } from '@dragon/types';
import { AuditService } from '../../audit/audit.service';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { PostService } from '../../content/posts/post.service';
import type { PostDocument } from '../../content/posts/post.schema';
import { ContentRevisionService } from '../../content/revisions/content-revision.service';
import type { ContentRevisionDocument } from '../../content/revisions/content-revision.schema';
import { RichTextValidator } from '../../content/rich-text/rich-text-validator';
import { HtmlSanitizer } from '../../content/rich-text/html-sanitizer';
import type { AdminContentListQueryDto } from './dto/admin-content-query';
import type { AdminCreatePostBodyDto, AdminUpdatePostBodyDto } from './dto/admin-post-body';
import type { PostMediaRefData } from '../../content/posts/post.types';

const EMPTY_TIPTAP_DOC: Record<string, unknown> = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function normalizeBodyJson(bodyJson: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(bodyJson).length === 0 ? { ...EMPTY_TIPTAP_DOC } : bodyJson;
}

const ALLOWED_ALIGNMENTS = new Set<string>(['left', 'center', 'right', 'full']);

function extractInlineMediaRefs(bodyJson: Record<string, unknown>): PostMediaRefData[] {
  const refs: PostMediaRefData[] = [];
  const seen = new Set<string>();

  function walk(node: unknown): void {
    if (typeof node !== 'object' || node === null || Array.isArray(node)) return;
    const n = node as Record<string, unknown>;
    if (n.type === 'image') {
      const attrs = n.attrs as Record<string, unknown> | undefined;
      const mediaId = attrs?.mediaId;
      if (typeof mediaId === 'string' && /^[0-9a-f]{24}$/.test(mediaId)) {
        const key = `${mediaId}:inline`;
        if (!seen.has(key)) {
          seen.add(key);
          refs.push({
            mediaId: new Types.ObjectId(mediaId),
            usage: 'inline',
            ...(typeof attrs?.alt === 'string' && attrs.alt ? { alt: attrs.alt } : {}),
            ...(typeof attrs?.caption === 'string' && attrs.caption
              ? { caption: attrs.caption }
              : {}),
            ...(typeof attrs?.alignment === 'string' && ALLOWED_ALIGNMENTS.has(attrs.alignment)
              ? { alignment: attrs.alignment as 'left' | 'center' | 'right' | 'full' }
              : {}),
          });
        }
      }
    }
    if (Array.isArray(n.content)) {
      for (const child of n.content) {
        walk(child);
      }
    }
  }

  walk(bodyJson);
  return refs;
}

function buildMediaRefs(
  bodyJson: Record<string, unknown>,
  coverMediaId: string | null,
): PostMediaRefData[] {
  const inlineRefs = extractInlineMediaRefs(bodyJson);
  if (!coverMediaId) return inlineRefs;
  const coverRef: PostMediaRefData = { mediaId: new Types.ObjectId(coverMediaId), usage: 'cover' };
  const seen = new Set<string>([`${coverMediaId}:cover`]);
  const result: PostMediaRefData[] = [coverRef];
  for (const ref of inlineRefs) {
    const key = `${String(ref.mediaId)}:${ref.usage}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(ref);
    }
  }
  return result;
}

function toPostSnapshot(post: PostDocument): Record<string, unknown> {
  return {
    title: post.title,
    slug: post.slug,
    type: post.type,
    excerpt: post.excerpt,
    bodyJson: post.bodyJson,
    bodyHtml: post.bodyHtml,
    status: post.status,
    categoryIds: (post.categoryIds ?? []).map(String),
    tagIds: (post.tagIds ?? []).map(String),
    seo: post.seo,
  };
}

@Injectable()
export class AdminContentPostsService {
  constructor(
    private readonly postService: PostService,
    private readonly revisionService: ContentRevisionService,
    private readonly richTextValidator: RichTextValidator,
    private readonly htmlSanitizer: HtmlSanitizer,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async listPosts(
    query: AdminContentListQueryDto,
  ): Promise<{ items: PostDocument[]; total: number }> {
    return this.postService.list(
      {
        ...(query.type !== undefined ? { type: query.type } : {}),
        ...(query.status !== undefined ? { status: query.status } : {}),
        includeDeleted: query.includeDeleted,
      },
      query.page,
      query.limit,
    );
  }

  async createPost(input: AdminCreatePostBodyDto, authorId: string): Promise<PostDocument> {
    const bodyJson = input.bodyJson !== undefined ? normalizeBodyJson(input.bodyJson) : undefined;

    if (bodyJson !== undefined) {
      const validation = this.richTextValidator.validate(bodyJson);
      if (!validation.valid) {
        throw new BadRequestException(
          `Invalid bodyJson: ${validation.errors.map((e) => e.message).join('; ')}`,
        );
      }
    }

    const safeBodyHtml = this.htmlSanitizer.sanitize(input.bodyHtml);

    const effectiveBodyJson = bodyJson ?? EMPTY_TIPTAP_DOC;
    const effectiveCoverMediaId = input.coverMediaId ?? null;
    const mediaRefs = buildMediaRefs(effectiveBodyJson, effectiveCoverMediaId);

    const post = await this.postService.create({
      type: input.type,
      title: input.title,
      slug: input.slug,
      slugNormalized: input.slug,
      ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
      ...(bodyJson !== undefined ? { bodyJson } : {}),
      bodyHtml: safeBodyHtml,
      authorId,
      categoryIds: input.categoryIds,
      tagIds: input.tagIds,
      seo: input.seo,
      ...(effectiveCoverMediaId ? { coverMediaId: effectiveCoverMediaId } : {}),
      mediaRefs,
    });

    await this.revisionService.snapshot('post', String(post._id), toPostSnapshot(post), authorId);

    void this.auditService?.log({
      actorId: authorId,
      actorType: 'admin',
      action: AuditAction.CONTENT_POST_CREATED,
      resourceType: 'content_post',
      resourceId: String(post._id),
      after: { title: post.title, slug: post.slug, type: post.type },
      severity: 'info',
    });

    return post;
  }

  async getPost(rawId: string): Promise<PostDocument> {
    const id = validateObjectId(rawId, 'id');
    const post = await this.postService.findById(id);
    if (!post) throw new NotFoundException('Post not found.');
    return post;
  }

  async updatePost(
    rawId: string,
    input: AdminUpdatePostBodyDto,
    editorId: string,
  ): Promise<PostDocument> {
    const id = validateObjectId(rawId, 'id');

    const normalizedBodyJson =
      input.bodyJson !== undefined ? normalizeBodyJson(input.bodyJson) : undefined;

    if (normalizedBodyJson !== undefined) {
      const validation = this.richTextValidator.validate(normalizedBodyJson);
      if (!validation.valid) {
        throw new BadRequestException(
          `Invalid bodyJson: ${validation.errors.map((e) => e.message).join('; ')}`,
        );
      }
    }

    const currentPost = await this.postService.findById(id);
    if (!currentPost) throw new NotFoundException('Post not found.');

    const effectiveBodyJson =
      normalizedBodyJson ?? (currentPost.bodyJson as Record<string, unknown>);
    const effectiveCoverMediaId: string | null =
      input.coverMediaId !== undefined
        ? (input.coverMediaId ?? null)
        : currentPost.coverMediaId
          ? String(currentPost.coverMediaId)
          : null;
    const mediaRefs = buildMediaRefs(effectiveBodyJson, effectiveCoverMediaId);

    const effectiveInput: AdminUpdatePostBodyDto =
      normalizedBodyJson !== undefined ? { ...input, bodyJson: normalizedBodyJson } : input;

    const safeInput: AdminUpdatePostBodyDto =
      effectiveInput.bodyHtml !== undefined
        ? ({
            ...effectiveInput,
            bodyHtml: this.htmlSanitizer.sanitize(effectiveInput.bodyHtml),
          } as AdminUpdatePostBodyDto)
        : effectiveInput;

    if (safeInput.slug !== undefined) {
      const updated = await this.postService.updateSlug(id, {
        slug: safeInput.slug,
        slugNormalized: safeInput.slug,
      });
      const { slug: omittedSlug, ...rest } = safeInput;
      const hasOtherFields = omittedSlug !== undefined && Object.keys(rest).length > 0;

      const result = hasOtherFields
        ? await this.postService.update(id, { ...rest, mediaRefs })
        : await this.postService.update(id, { mediaRefs });

      const post = result ?? updated;
      await this.revisionService.snapshot('post', id, toPostSnapshot(post), editorId);

      void this.auditService?.log({
        actorId: editorId,
        actorType: 'admin',
        action: AuditAction.CONTENT_POST_UPDATED,
        resourceType: 'content_post',
        resourceId: id,
        after: { title: post.title, slug: post.slug },
        severity: 'info',
      });

      return post;
    }

    const updated = await this.postService.update(id, { ...safeInput, mediaRefs });
    if (!updated) throw new NotFoundException('Post not found.');
    await this.revisionService.snapshot('post', id, toPostSnapshot(updated), editorId);

    void this.auditService?.log({
      actorId: editorId,
      actorType: 'admin',
      action: AuditAction.CONTENT_POST_UPDATED,
      resourceType: 'content_post',
      resourceId: id,
      after: { title: updated.title, slug: updated.slug },
      severity: 'info',
    });

    return updated;
  }

  async previewPost(rawId: string): Promise<PostDocument> {
    return this.getPost(rawId);
  }

  async publishPost(rawId: string, editorId: string): Promise<PostDocument> {
    const id = validateObjectId(rawId, 'id');
    const post = await this.postService.markPublished(id);
    await this.revisionService.snapshot('post', id, toPostSnapshot(post), editorId);

    void this.auditService?.log({
      actorId: editorId,
      actorType: 'admin',
      action: AuditAction.CONTENT_POST_PUBLISHED,
      resourceType: 'content_post',
      resourceId: id,
      after: { status: 'published' },
      severity: 'info',
    });

    return post;
  }

  async archivePost(rawId: string, editorId: string): Promise<PostDocument> {
    const id = validateObjectId(rawId, 'id');
    const post = await this.postService.markArchived(id);
    await this.revisionService.snapshot('post', id, toPostSnapshot(post), editorId);

    void this.auditService?.log({
      actorId: editorId,
      actorType: 'admin',
      action: AuditAction.CONTENT_POST_ARCHIVED,
      resourceType: 'content_post',
      resourceId: id,
      after: { status: 'archived' },
      severity: 'info',
    });

    return post;
  }

  async softDeletePost(rawId: string, editorId?: string): Promise<PostDocument> {
    const id = validateObjectId(rawId, 'id');
    const post = await this.postService.softDelete(id);

    void this.auditService?.log({
      ...(editorId ? { actorId: editorId } : {}),
      actorType: 'admin',
      action: AuditAction.CONTENT_POST_SOFT_DELETED,
      resourceType: 'content_post',
      resourceId: id,
      after: { deletedAt: new Date().toISOString() },
      severity: 'warning',
    });

    return post;
  }

  async listPostRevisions(rawId: string): Promise<ContentRevisionDocument[]> {
    const id = validateObjectId(rawId, 'id');
    const post = await this.postService.findById(id);
    if (!post) throw new NotFoundException('Post not found.');
    return this.revisionService.listByResource('post', id);
  }

  async getPostRevision(
    rawPostId: string,
    rawRevisionId: string,
  ): Promise<ContentRevisionDocument> {
    const postId = validateObjectId(rawPostId, 'id');
    const revisionId = validateObjectId(rawRevisionId, 'revisionId');

    const post = await this.postService.findById(postId);
    if (!post) throw new NotFoundException('Post not found.');

    const revision = await this.revisionService.findById(revisionId);
    if (!revision || String(revision.resourceId) !== postId || revision.resourceType !== 'post') {
      throw new NotFoundException('Revision not found.');
    }
    return revision;
  }
}
