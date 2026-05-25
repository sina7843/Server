import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { AuditAction } from '@dragon/types';
import { AuditService } from '../../audit/audit.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { PageService } from '../../content/pages/page.service';
import type { PageDocument } from '../../content/pages/page.schema';
import { ContentRevisionService } from '../../content/revisions/content-revision.service';
import type { ContentRevisionDocument } from '../../content/revisions/content-revision.schema';
import { RichTextValidator } from '../../content/rich-text/rich-text-validator';
import { HtmlSanitizer } from '../../content/rich-text/html-sanitizer';
import type { AdminPageListQueryDto } from './dto/admin-content-query';
import type { AdminCreatePageBodyDto, AdminUpdatePageBodyDto } from './dto/admin-page-body';

const EMPTY_TIPTAP_DOC: Record<string, unknown> = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function normalizeBodyJson(bodyJson: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(bodyJson).length === 0 ? { ...EMPTY_TIPTAP_DOC } : bodyJson;
}

function toPageSnapshot(page: PageDocument): Record<string, unknown> {
  return {
    title: page.title,
    slug: page.slug,
    bodyJson: page.bodyJson,
    bodyHtml: page.bodyHtml,
    status: page.status,
    seo: page.seo,
  };
}

@Injectable()
export class AdminContentPagesService {
  constructor(
    private readonly pageService: PageService,
    private readonly revisionService: ContentRevisionService,
    private readonly richTextValidator: RichTextValidator,
    private readonly htmlSanitizer: HtmlSanitizer,
    @Optional() private readonly auditService?: AuditService,
    @Optional() private readonly analyticsService?: AnalyticsService,
  ) {}

  async listPages(query: AdminPageListQueryDto): Promise<{ items: PageDocument[]; total: number }> {
    return this.pageService.list(
      {
        ...(query.status !== undefined ? { status: query.status } : {}),
        includeDeleted: query.includeDeleted,
      },
      query.page,
      query.limit,
    );
  }

  async createPage(input: AdminCreatePageBodyDto, authorId: string): Promise<PageDocument> {
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

    const page = await this.pageService.create({
      title: input.title,
      slug: input.slug,
      slugNormalized: input.slug,
      ...(bodyJson !== undefined ? { bodyJson } : {}),
      bodyHtml: safeBodyHtml,
      createdBy: authorId,
      seo: input.seo,
    });

    await this.revisionService.snapshot('page', String(page._id), toPageSnapshot(page), authorId);
    void this.auditService?.log({
      actorId: authorId,
      actorType: 'admin',
      action: AuditAction.CONTENT_PAGE_CREATED,
      resourceType: 'content_page',
      resourceId: String(page._id),
      after: { title: page.title, slug: page.slug, status: page.status },
      severity: 'info',
    });

    return page;
  }

  async getPage(rawId: string): Promise<PageDocument> {
    const id = validateObjectId(rawId, 'id');
    const page = await this.pageService.findById(id);
    if (!page) throw new NotFoundException('Page not found.');
    return page;
  }

  async updatePage(
    rawId: string,
    input: AdminUpdatePageBodyDto,
    editorId: string,
  ): Promise<PageDocument> {
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

    const effectiveInput: AdminUpdatePageBodyDto =
      normalizedBodyJson !== undefined ? { ...input, bodyJson: normalizedBodyJson } : input;

    const safeInput: AdminUpdatePageBodyDto =
      effectiveInput.bodyHtml !== undefined
        ? ({
            ...effectiveInput,
            bodyHtml: this.htmlSanitizer.sanitize(effectiveInput.bodyHtml),
          } as AdminUpdatePageBodyDto)
        : effectiveInput;

    if (safeInput.slug !== undefined) {
      const updated = await this.pageService.updateSlug(id, {
        slug: safeInput.slug,
        slugNormalized: safeInput.slug,
      });
      const { slug: omittedSlug, ...rest } = safeInput;
      const hasOtherFields = omittedSlug !== undefined && Object.keys(rest).length > 0;

      const result = hasOtherFields
        ? await this.pageService.update(id, { ...rest, updatedBy: editorId })
        : updated;

      const page = result ?? updated;
      await this.revisionService.snapshot('page', id, toPageSnapshot(page), editorId);
      void this.auditService?.log({
        actorId: editorId,
        actorType: 'admin',
        action: AuditAction.CONTENT_PAGE_UPDATED,
        resourceType: 'content_page',
        resourceId: id,
        after: { title: page.title, slug: page.slug, status: page.status },
        severity: 'info',
      });
      return page;
    }

    const updated = await this.pageService.update(id, { ...safeInput, updatedBy: editorId });
    if (!updated) throw new NotFoundException('Page not found.');
    await this.revisionService.snapshot('page', id, toPageSnapshot(updated), editorId);
    void this.auditService?.log({
      actorId: editorId,
      actorType: 'admin',
      action: AuditAction.CONTENT_PAGE_UPDATED,
      resourceType: 'content_page',
      resourceId: id,
      after: { title: updated.title, slug: updated.slug, status: updated.status },
      severity: 'info',
    });
    return updated;
  }

  async previewPage(rawId: string): Promise<PageDocument> {
    return this.getPage(rawId);
  }

  async publishPage(rawId: string, editorId: string): Promise<PageDocument> {
    const id = validateObjectId(rawId, 'id');
    const page = await this.pageService.markPublished(id);
    await this.revisionService.snapshot('page', id, toPageSnapshot(page), editorId);
    this.analyticsService?.track({
      type: 'content.published',
      userId: editorId,
      resourceType: 'content_page',
      resourceId: id,
    });
    void this.auditService?.log({
      actorId: editorId,
      actorType: 'admin',
      action: AuditAction.CONTENT_PAGE_PUBLISHED,
      resourceType: 'content_page',
      resourceId: id,
      after: { title: page.title, slug: page.slug, status: page.status },
      severity: 'info',
    });
    return page;
  }

  async archivePage(rawId: string, editorId: string): Promise<PageDocument> {
    const id = validateObjectId(rawId, 'id');
    const page = await this.pageService.markArchived(id);
    await this.revisionService.snapshot('page', id, toPageSnapshot(page), editorId);
    void this.auditService?.log({
      actorId: editorId,
      actorType: 'admin',
      action: AuditAction.CONTENT_PAGE_ARCHIVED,
      resourceType: 'content_page',
      resourceId: id,
      after: { title: page.title, slug: page.slug, status: page.status },
      severity: 'info',
    });
    return page;
  }

  async softDeletePage(rawId: string, editorId?: string): Promise<PageDocument> {
    const id = validateObjectId(rawId, 'id');
    const page = await this.pageService.softDelete(id);
    void this.auditService?.log({
      ...(editorId !== undefined ? { actorId: editorId } : {}),
      actorType: 'admin',
      action: AuditAction.CONTENT_PAGE_SOFT_DELETED,
      resourceType: 'content_page',
      resourceId: id,
      after: { status: 'deleted' },
      severity: 'warning',
    });
    return page;
  }

  async listPageRevisions(rawId: string): Promise<ContentRevisionDocument[]> {
    const id = validateObjectId(rawId, 'id');
    const page = await this.pageService.findById(id);
    if (!page) throw new NotFoundException('Page not found.');
    return this.revisionService.listByResource('page', id);
  }

  async getPageRevision(
    rawPageId: string,
    rawRevisionId: string,
  ): Promise<ContentRevisionDocument> {
    const pageId = validateObjectId(rawPageId, 'id');
    const revisionId = validateObjectId(rawRevisionId, 'revisionId');

    const page = await this.pageService.findById(pageId);
    if (!page) throw new NotFoundException('Page not found.');

    const revision = await this.revisionService.findById(revisionId);
    if (!revision || String(revision.resourceId) !== pageId || revision.resourceType !== 'page') {
      throw new NotFoundException('Revision not found.');
    }
    return revision;
  }
}
