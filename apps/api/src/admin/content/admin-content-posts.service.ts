import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { PostService } from '../../content/posts/post.service';
import type { PostDocument } from '../../content/posts/post.schema';
import { ContentRevisionService } from '../../content/revisions/content-revision.service';
import type { ContentRevisionDocument } from '../../content/revisions/content-revision.schema';
import { RichTextValidator } from '../../content/rich-text/rich-text-validator';
import { HtmlSanitizer } from '../../content/rich-text/html-sanitizer';
import type { AdminContentListQueryDto } from './dto/admin-content-query';
import type { AdminCreatePostBodyDto, AdminUpdatePostBodyDto } from './dto/admin-post-body';

const EMPTY_TIPTAP_DOC: Record<string, unknown> = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function normalizeBodyJson(bodyJson: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(bodyJson).length === 0 ? { ...EMPTY_TIPTAP_DOC } : bodyJson;
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
    const bodyJson =
      input.bodyJson !== undefined ? normalizeBodyJson(input.bodyJson) : undefined;

    if (bodyJson !== undefined) {
      const validation = this.richTextValidator.validate(bodyJson);
      if (!validation.valid) {
        throw new BadRequestException(
          `Invalid bodyJson: ${validation.errors.map((e) => e.message).join('; ')}`,
        );
      }
    }

    const safeBodyHtml = this.htmlSanitizer.sanitize(input.bodyHtml);

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
    });

    await this.revisionService.snapshot('post', String(post._id), toPostSnapshot(post), authorId);

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

    if (input.bodyJson !== undefined && typeof input.bodyJson.type === 'string') {
      const validation = this.richTextValidator.validate(input.bodyJson);
      if (!validation.valid) {
        throw new BadRequestException(
          `Invalid bodyJson: ${validation.errors.map((e) => e.message).join('; ')}`,
        );
      }
    }

    const safeInput: AdminUpdatePostBodyDto =
      input.bodyHtml !== undefined
        ? ({
            ...input,
            bodyHtml: this.htmlSanitizer.sanitize(input.bodyHtml),
          } as AdminUpdatePostBodyDto)
        : input;

    if (safeInput.slug !== undefined) {
      const updated = await this.postService.updateSlug(id, {
        slug: safeInput.slug,
        slugNormalized: safeInput.slug,
      });
      const { slug: omittedSlug, ...rest } = safeInput;
      const hasOtherFields = omittedSlug !== undefined && Object.keys(rest).length > 0;

      const result = hasOtherFields ? await this.postService.update(id, rest) : updated;

      const post = result ?? updated;
      await this.revisionService.snapshot('post', id, toPostSnapshot(post), editorId);
      return post;
    }

    const updated = await this.postService.update(id, safeInput);
    if (!updated) throw new NotFoundException('Post not found.');
    await this.revisionService.snapshot('post', id, toPostSnapshot(updated), editorId);
    return updated;
  }

  async previewPost(rawId: string): Promise<PostDocument> {
    return this.getPost(rawId);
  }

  async publishPost(rawId: string, editorId: string): Promise<PostDocument> {
    const id = validateObjectId(rawId, 'id');
    const post = await this.postService.markPublished(id);
    await this.revisionService.snapshot('post', id, toPostSnapshot(post), editorId);
    return post;
  }

  async archivePost(rawId: string, editorId: string): Promise<PostDocument> {
    const id = validateObjectId(rawId, 'id');
    const post = await this.postService.markArchived(id);
    await this.revisionService.snapshot('post', id, toPostSnapshot(post), editorId);
    return post;
  }

  async softDeletePost(rawId: string): Promise<PostDocument> {
    const id = validateObjectId(rawId, 'id');
    return this.postService.softDelete(id);
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
