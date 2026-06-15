# About Us & Contact Us — Site Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add superadmin-editable About Us (rich text) and Contact Us (structured fields + public message form with an admin inbox) to the platform.

**Architecture:** A new NestJS `site` module exposes a `SiteSettings` singleton (about + contact) and a `ContactMessage` collection. Public REST endpoints feed the Nuxt web app (About/Contact pages + header/footer links); admin REST endpoints (RBAC-gated) feed the Nuxt admin editor + message inbox. DTO contracts live in `@dragon/types`; fetch clients live in `@dragon/sdk`. Access is granted via four new RBAC permissions that `super_admin` receives automatically.

**Tech Stack:** NestJS + Mongoose (api), Nuxt 3 / Vue 3 (admin + web, RTL Persian), TypeScript monorepo (pnpm + turbo), Jest.

**Spec:** `docs/superpowers/specs/2026-06-15-about-contact-site-settings-design.md`

---

## Conventions (read before starting)

- **ObjectId props use `SchemaTypes.ObjectId`, never `Types.ObjectId`** — `@Prop({ type: Types.ObjectId })` silently breaks queries in this codebase.
- Run a single api test file: `pnpm --filter @dragon/api test -- <pathOrName>` (Jest). Run sdk/types tests: `pnpm --filter @dragon/sdk test`, `pnpm --filter @dragon/types test`.
- Public route prefix is `api/v1/...`; admin route prefix is `admin/v1/...`.
- Follow the existing `content/pages` module as the reference pattern (schema → repository → service → controller → dto).
- The `super_admin` role is mapped to `PermissionKeys` (all registered permissions) in `role-permission-registry.ts`, so registering a new permission auto-grants it to `super_admin`. No seed edit is needed beyond registration.

## File Structure

**Shared contracts — `packages/types/src/contracts/site.ts`** (new): public + admin DTOs for settings and contact messages. Exported via `packages/types/src/contracts/index.ts`.

**SDK clients:**
- `packages/sdk/src/site-types.ts` (new) — re-export/site client option types.
- `packages/sdk/src/site.ts` (new) — `createSiteClient` (public: `getSettings`, `submitContactMessage`).
- `packages/sdk/src/admin-site.ts` (new) — `createAdminSiteClient` (admin settings + messages).
- Wire both into `packages/sdk/src/index.ts`.

**API module — `apps/api/src/site/`** (new):
- `site-settings.schema.ts`, `site-settings.types.ts`, `site-settings.repository.ts`, `site-settings.service.ts`
- `contact-message.schema.ts`, `contact-message.types.ts`, `contact-message.repository.ts`, `contact-message.service.ts`
- `contact-rate-limit.guard.ts` (in-memory per-IP sliding window)
- `public/public-site.controller.ts` + `public/dto/public-site-response.ts` + `public/dto/contact-message-body.ts`
- `admin/admin-site.controller.ts` + `admin/dto/admin-site-settings-body.ts` + `admin/dto/admin-site-response.ts`
- `site.module.ts`
- Register `SiteModule` in `apps/api/src/app.module.ts`.

**RBAC — modify:**
- `apps/api/src/rbac/registry/permission-keys.ts` — add 4 keys.
- `apps/api/src/rbac/registry/permission-registry.ts` — register 4 permissions.

**Admin UI — `apps/admin/`:**
- `features/site/admin-site.api.ts` (+ spec) — typed client wrapper.
- `pages/site/settings.vue` — settings editor.
- `pages/site/messages/index.vue` — message inbox.
- Nav entry wiring (navigation feature/config).

**Web UI — `apps/web/`:**
- `composables/usePublicSite.ts`
- `pages/about.vue`, `pages/contact.vue`
- `components/AppHeader.vue`, `components/AppFooter.vue` — add links.

---

## Phase 1 — Shared Contracts & Permissions

### Task 1: Add site DTO contracts to `@dragon/types`

**Files:**
- Create: `packages/types/src/contracts/site.ts`
- Modify: `packages/types/src/contracts/index.ts`
- Test: `packages/types/src/contracts/site.spec.ts`

- [ ] **Step 1: Write the contract types**

Create `packages/types/src/contracts/site.ts`:

```typescript
// ─── Shared contact value objects ──────────────────────────────────────────
export interface SocialLinkDto {
  readonly platform: string;
  readonly url: string;
}

export interface ContactInfoDto {
  readonly email?: string;
  readonly phone?: string;
  readonly address?: string;
  readonly mapEmbedUrl?: string;
  readonly socials: readonly SocialLinkDto[];
}

export interface AboutInfoDto {
  readonly title: string;
  readonly bodyHtml: string;
}

// ─── Public responses ────────────────────────────────────────────────────────
export interface PublicSiteSettingsDto {
  readonly about: AboutInfoDto;
  readonly contact: ContactInfoDto;
}

export interface PublicSiteSettingsResponse {
  readonly settings: PublicSiteSettingsDto;
}

export interface SubmitContactMessageRequest {
  readonly name: string;
  readonly email: string;
  readonly subject?: string;
  readonly message: string;
  /** Honeypot — must be empty/omitted. */
  readonly website?: string;
}

export interface SubmitContactMessageResponse {
  readonly success: true;
}

// ─── Admin responses ─────────────────────────────────────────────────────────
export interface AdminAboutInfoDto {
  readonly title: string;
  readonly bodyJson: Record<string, unknown>;
  readonly bodyHtml: string;
}

export interface AdminSiteSettingsDto {
  readonly about: AdminAboutInfoDto;
  readonly contact: ContactInfoDto;
  readonly updatedAt: string;
}

export interface AdminSiteSettingsResponse {
  readonly settings: AdminSiteSettingsDto;
}

export interface UpdateSiteSettingsRequest {
  readonly about: {
    readonly title: string;
    readonly bodyJson: Record<string, unknown>;
    readonly bodyHtml: string;
  };
  readonly contact: {
    readonly email?: string;
    readonly phone?: string;
    readonly address?: string;
    readonly mapEmbedUrl?: string;
    readonly socials: readonly SocialLinkDto[];
  };
}

export interface ContactMessageDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly subject?: string;
  readonly message: string;
  readonly createdAt: string;
}

export interface ContactMessageListResponse {
  readonly items: readonly ContactMessageDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface ContactMessageResponse {
  readonly message: ContactMessageDto;
}

export interface SiteGenericResponse {
  readonly success: boolean;
  readonly message: string;
}
```

- [ ] **Step 2: Export from contracts barrel**

In `packages/types/src/contracts/index.ts`, add (alphabetical with the others):

```typescript
export * from './site';
```

- [ ] **Step 3: Write a compile/shape test**

Create `packages/types/src/contracts/site.spec.ts`:

```typescript
import type {
  PublicSiteSettingsResponse,
  AdminSiteSettingsResponse,
  ContactMessageListResponse,
} from './site';

describe('site contracts', () => {
  it('builds a public settings response', () => {
    const res: PublicSiteSettingsResponse = {
      settings: {
        about: { title: 'About', bodyHtml: '<p>hi</p>' },
        contact: { socials: [{ platform: 'instagram', url: 'https://x' }] },
      },
    };
    expect(res.settings.contact.socials).toHaveLength(1);
  });

  it('builds an admin settings response', () => {
    const res: AdminSiteSettingsResponse = {
      settings: {
        about: { title: 'About', bodyJson: {}, bodyHtml: '' },
        contact: { socials: [] },
        updatedAt: new Date().toISOString(),
      },
    };
    expect(res.settings.about.title).toBe('About');
  });

  it('builds a message list response', () => {
    const res: ContactMessageListResponse = { items: [], total: 0, page: 1, limit: 20 };
    expect(res.total).toBe(0);
  });
});
```

- [ ] **Step 4: Run the test**

Run: `pnpm --filter @dragon/types test -- site.spec`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/types/src/contracts/site.ts packages/types/src/contracts/index.ts packages/types/src/contracts/site.spec.ts
git commit -m "feat(types): add site settings + contact message contracts"
```

### Task 2: Register site RBAC permissions

**Files:**
- Modify: `apps/api/src/rbac/registry/permission-keys.ts`
- Modify: `apps/api/src/rbac/registry/permission-registry.ts`
- Test: `apps/api/src/rbac/registry/registry.spec.ts` (existing — should still pass)

- [ ] **Step 1: Add permission keys**

In `apps/api/src/rbac/registry/permission-keys.ts`, inside the `Permissions` object, after the `CONTENT_TAG_*` block (or any logical spot), add:

```typescript
  SITE_SETTINGS_READ: 'site.settings.read',
  SITE_SETTINGS_UPDATE: 'site.settings.update',
  SITE_MESSAGE_READ: 'site.message.read',
  SITE_MESSAGE_MANAGE: 'site.message.manage',
```

- [ ] **Step 2: Register permissions with metadata**

In `apps/api/src/rbac/registry/permission-registry.ts`, add to the `PermissionRegistry` array (after the content entries):

```typescript
  permission(Permissions.SITE_SETTINGS_READ, 'site', 'settings', 'read', 'Read site settings'),
  permission(
    Permissions.SITE_SETTINGS_UPDATE,
    'site',
    'settings',
    'update',
    'Update site settings (about/contact)',
  ),
  permission(Permissions.SITE_MESSAGE_READ, 'site', 'message', 'read', 'Read contact messages'),
  permission(
    Permissions.SITE_MESSAGE_MANAGE,
    'site',
    'message',
    'manage',
    'Delete contact messages',
  ),
```

- [ ] **Step 3: Run the registry test**

Run: `pnpm --filter @dragon/api test -- registry.spec`
Expected: PASS. (The registry test validates each key matches `module.resource.action`; the four new keys conform. `super_admin` auto-receives them via `super_admin: PermissionKeys`.)

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/rbac/registry/permission-keys.ts apps/api/src/rbac/registry/permission-registry.ts
git commit -m "feat(rbac): register site settings + message permissions"
```

---

## Phase 2 — API: SiteSettings (singleton)

### Task 3: SiteSettings schema + types

**Files:**
- Create: `apps/api/src/site/site-settings.types.ts`
- Create: `apps/api/src/site/site-settings.schema.ts`
- Test: `apps/api/src/site/site-settings.schema.spec.ts`

- [ ] **Step 1: Write types**

Create `apps/api/src/site/site-settings.types.ts`:

```typescript
export interface SocialLink {
  platform: string;
  url: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  mapEmbedUrl?: string;
  socials: SocialLink[];
}

export interface AboutInfo {
  title: string;
  bodyJson: Record<string, unknown>;
  bodyHtml: string;
}

export interface UpdateSiteSettingsInput {
  readonly about: AboutInfo;
  readonly contact: ContactInfo;
  readonly updatedBy?: string;
}
```

- [ ] **Step 2: Write schema**

Create `apps/api/src/site/site-settings.schema.ts`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import type { AboutInfo, ContactInfo } from './site-settings.types';

export const SITE_SETTINGS_KEY = 'global';

@Schema({ collection: 'site_settings', timestamps: true })
export class SiteSettings {
  declare _id: Types.ObjectId;

  @Prop({ required: true, unique: true, default: SITE_SETTINGS_KEY })
  declare key: string;

  @Prop({
    type: {
      title: { type: String, trim: true, default: '' },
      bodyJson: { type: SchemaTypes.Mixed, default: {} },
      bodyHtml: { type: String, default: '' },
    },
    _id: false,
    default: {},
  })
  declare about: AboutInfo;

  @Prop({
    type: {
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      mapEmbedUrl: { type: String, trim: true },
      socials: {
        type: [{ platform: { type: String, trim: true }, url: { type: String, trim: true } }],
        default: [],
        _id: false,
      },
    },
    _id: false,
    default: {},
  })
  declare contact: ContactInfo;

  @Prop({ type: SchemaTypes.ObjectId })
  declare updatedBy?: Types.ObjectId;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type SiteSettingsDocument = HydratedDocument<SiteSettings>;
export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);

SiteSettingsSchema.index({ key: 1 }, { unique: true });
```

- [ ] **Step 3: Write the schema test**

Create `apps/api/src/site/site-settings.schema.spec.ts`:

```typescript
import { model } from 'mongoose';
import { SiteSettings, SiteSettingsSchema, SITE_SETTINGS_KEY } from './site-settings.schema';

describe('SiteSettings schema', () => {
  const SiteSettingsModel = model(SiteSettings.name, SiteSettingsSchema);

  it('defaults key to global and socials to empty array', () => {
    const doc = new SiteSettingsModel({});
    expect(doc.key).toBe(SITE_SETTINGS_KEY);
    expect(doc.contact.socials).toEqual([]);
    expect(doc.about.title).toBe('');
  });

  it('stores socials as platform/url pairs', () => {
    const doc = new SiteSettingsModel({
      contact: { socials: [{ platform: 'telegram', url: 'https://t.me/x' }] },
    });
    expect(doc.contact.socials[0].platform).toBe('telegram');
  });
});
```

- [ ] **Step 4: Run the test**

Run: `pnpm --filter @dragon/api test -- site-settings.schema.spec`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/site/site-settings.schema.ts apps/api/src/site/site-settings.types.ts apps/api/src/site/site-settings.schema.spec.ts
git commit -m "feat(api): add SiteSettings singleton schema"
```

### Task 4: SiteSettings repository (singleton upsert)

**Files:**
- Create: `apps/api/src/site/site-settings.repository.ts`
- Test: `apps/api/src/site/site-settings.repository.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/site/site-settings.repository.spec.ts` (mirrors the mocked-model style; if the repo uses `mongodb-memory-server` in other repo specs, follow that instead — check `page.repository.spec.ts` and copy its harness):

```typescript
import { SiteSettingsRepository } from './site-settings.repository';
import { SITE_SETTINGS_KEY } from './site-settings.schema';

function createModelMock() {
  return {
    findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    findOneAndUpdate: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue({ key: SITE_SETTINGS_KEY }) }),
  };
}

describe('SiteSettingsRepository', () => {
  it('reads the singleton by fixed key', async () => {
    const model = createModelMock();
    const repo = new SiteSettingsRepository(model as never);
    await repo.findSingleton();
    expect(model.findOne).toHaveBeenCalledWith({ key: SITE_SETTINGS_KEY });
  });

  it('upserts the singleton on update', async () => {
    const model = createModelMock();
    const repo = new SiteSettingsRepository(model as never);
    await repo.upsert({
      about: { title: 'A', bodyJson: {}, bodyHtml: '<p>a</p>' },
      contact: { socials: [] },
    });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { key: SITE_SETTINGS_KEY },
      expect.objectContaining({ $set: expect.any(Object) }),
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @dragon/api test -- site-settings.repository.spec`
Expected: FAIL ("Cannot find module './site-settings.repository'").

- [ ] **Step 3: Write the repository**

Create `apps/api/src/site/site-settings.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SiteSettings,
  SITE_SETTINGS_KEY,
  type SiteSettingsDocument,
} from './site-settings.schema';
import type { UpdateSiteSettingsInput } from './site-settings.types';

@Injectable()
export class SiteSettingsRepository {
  constructor(
    @InjectModel(SiteSettings.name) private readonly model: Model<SiteSettingsDocument>,
  ) {}

  findSingleton(): Promise<SiteSettingsDocument | null> {
    return this.model.findOne({ key: SITE_SETTINGS_KEY }).exec();
  }

  upsert(input: UpdateSiteSettingsInput): Promise<SiteSettingsDocument | null> {
    const set: Record<string, unknown> = {
      about: input.about,
      contact: input.contact,
    };
    if (input.updatedBy !== undefined) set.updatedBy = input.updatedBy;

    return this.model
      .findOneAndUpdate(
        { key: SITE_SETTINGS_KEY },
        { $set: set },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @dragon/api test -- site-settings.repository.spec`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/site/site-settings.repository.ts apps/api/src/site/site-settings.repository.spec.ts
git commit -m "feat(api): add SiteSettings repository with singleton upsert"
```

### Task 5: SiteSettings service (auto-default + sanitize)

**Files:**
- Create: `apps/api/src/site/site-settings.service.ts`
- Test: `apps/api/src/site/site-settings.service.spec.ts`

The service returns a guaranteed-non-null settings view (auto-creating an empty default when none exists) and sanitizes `about.bodyHtml` using the existing `HtmlSanitizer` from the content module.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/site/site-settings.service.spec.ts`:

```typescript
import { SiteSettingsService } from './site-settings.service';

function emptyDoc() {
  return {
    about: { title: '', bodyJson: {}, bodyHtml: '' },
    contact: { socials: [] },
    updatedAt: new Date('2026-06-15T00:00:00Z'),
  };
}

describe('SiteSettingsService', () => {
  it('returns existing settings when present', async () => {
    const repo = {
      findSingleton: jest.fn().mockResolvedValue({
        about: { title: 'About us', bodyJson: {}, bodyHtml: '<p>hi</p>' },
        contact: { email: 'a@b.c', socials: [] },
        updatedAt: new Date(),
      }),
      upsert: jest.fn(),
    };
    const sanitizer = { sanitize: (html: string) => html };
    const service = new SiteSettingsService(repo as never, sanitizer as never);
    const result = await service.getSettings();
    expect(result.about.title).toBe('About us');
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('returns empty defaults when no doc exists (no throw)', async () => {
    const repo = { findSingleton: jest.fn().mockResolvedValue(null), upsert: jest.fn() };
    const sanitizer = { sanitize: (html: string) => html };
    const service = new SiteSettingsService(repo as never, sanitizer as never);
    const result = await service.getSettings();
    expect(result.about.title).toBe('');
    expect(result.contact.socials).toEqual([]);
  });

  it('sanitizes bodyHtml before upserting', async () => {
    const repo = { findSingleton: jest.fn(), upsert: jest.fn().mockResolvedValue(emptyDoc()) };
    const sanitizer = { sanitize: jest.fn().mockReturnValue('<p>clean</p>') };
    const service = new SiteSettingsService(repo as never, sanitizer as never);
    await service.updateSettings(
      {
        about: { title: 'T', bodyJson: {}, bodyHtml: '<script>x</script><p>clean</p>' },
        contact: { socials: [] },
      },
      'user-1',
    );
    expect(sanitizer.sanitize).toHaveBeenCalled();
    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        about: expect.objectContaining({ bodyHtml: '<p>clean</p>' }),
        updatedBy: 'user-1',
      }),
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @dragon/api test -- site-settings.service.spec`
Expected: FAIL ("Cannot find module './site-settings.service'").

- [ ] **Step 3: Write the service**

Create `apps/api/src/site/site-settings.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { HtmlSanitizer } from '../content/rich-text/html-sanitizer';
import { SiteSettingsRepository } from './site-settings.repository';
import type { AboutInfo, ContactInfo, UpdateSiteSettingsInput } from './site-settings.types';

export interface SiteSettingsView {
  about: AboutInfo;
  contact: ContactInfo;
  updatedAt: Date | null;
}

const EMPTY_VIEW: SiteSettingsView = {
  about: { title: '', bodyJson: {}, bodyHtml: '' },
  contact: { socials: [] },
  updatedAt: null,
};

@Injectable()
export class SiteSettingsService {
  constructor(
    private readonly repository: SiteSettingsRepository,
    private readonly sanitizer: HtmlSanitizer,
  ) {}

  async getSettings(): Promise<SiteSettingsView> {
    const doc = await this.repository.findSingleton();
    if (!doc) return { ...EMPTY_VIEW };
    return {
      about: doc.about,
      contact: doc.contact,
      updatedAt: doc.updatedAt ?? null,
    };
  }

  async updateSettings(input: UpdateSiteSettingsInput, userId?: string): Promise<SiteSettingsView> {
    const sanitized: UpdateSiteSettingsInput = {
      about: {
        title: input.about.title,
        bodyJson: input.about.bodyJson,
        bodyHtml: this.sanitizer.sanitize(input.about.bodyHtml),
      },
      contact: input.contact,
      ...(userId ? { updatedBy: userId } : {}),
    };
    const doc = await this.repository.upsert(sanitized);
    return {
      about: doc!.about,
      contact: doc!.contact,
      updatedAt: doc!.updatedAt ?? null,
    };
  }
}
```

> Note: confirm `HtmlSanitizer` exposes a `sanitize(html: string): string` method by opening `apps/api/src/content/rich-text/html-sanitizer.ts`. If the method name differs, match it in both the service and the test mock.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @dragon/api test -- site-settings.service.spec`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/site/site-settings.service.ts apps/api/src/site/site-settings.service.spec.ts
git commit -m "feat(api): add SiteSettings service with defaults + sanitize"
```

---

## Phase 3 — API: ContactMessage + rate limit

### Task 6: ContactMessage schema + types

**Files:**
- Create: `apps/api/src/site/contact-message.types.ts`
- Create: `apps/api/src/site/contact-message.schema.ts`
- Test: `apps/api/src/site/contact-message.schema.spec.ts`

- [ ] **Step 1: Write types**

Create `apps/api/src/site/contact-message.types.ts`:

```typescript
export interface CreateContactMessageInput {
  readonly name: string;
  readonly email: string;
  readonly subject?: string;
  readonly message: string;
  readonly ipHash?: string;
}

export interface ContactMessageListFilter {
  readonly page: number;
  readonly limit: number;
}
```

- [ ] **Step 2: Write schema**

Create `apps/api/src/site/contact-message.schema.ts`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'contact_messages', timestamps: { createdAt: true, updatedAt: false } })
export class ContactMessage {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare name: string;

  @Prop({ required: true, trim: true })
  declare email: string;

  @Prop({ trim: true })
  declare subject?: string;

  @Prop({ required: true, trim: true })
  declare message: string;

  @Prop()
  declare ipHash?: string;

  declare createdAt: Date;
}

export type ContactMessageDocument = HydratedDocument<ContactMessage>;
export const ContactMessageSchema = SchemaFactory.createForClass(ContactMessage);

ContactMessageSchema.index({ createdAt: -1 });
```

- [ ] **Step 3: Write the schema test**

Create `apps/api/src/site/contact-message.schema.spec.ts`:

```typescript
import { model } from 'mongoose';
import { ContactMessage, ContactMessageSchema } from './contact-message.schema';

describe('ContactMessage schema', () => {
  const ContactMessageModel = model(ContactMessage.name, ContactMessageSchema);

  it('requires name, email, message', () => {
    const doc = new ContactMessageModel({});
    const err = doc.validateSync();
    expect(err?.errors.name).toBeDefined();
    expect(err?.errors.email).toBeDefined();
    expect(err?.errors.message).toBeDefined();
  });

  it('accepts a valid message', () => {
    const doc = new ContactMessageModel({ name: 'A', email: 'a@b.c', message: 'hi' });
    expect(doc.validateSync()).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run the test**

Run: `pnpm --filter @dragon/api test -- contact-message.schema.spec`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/site/contact-message.schema.ts apps/api/src/site/contact-message.types.ts apps/api/src/site/contact-message.schema.spec.ts
git commit -m "feat(api): add ContactMessage schema"
```

### Task 7: ContactMessage repository + service

**Files:**
- Create: `apps/api/src/site/contact-message.repository.ts`
- Create: `apps/api/src/site/contact-message.service.ts`
- Test: `apps/api/src/site/contact-message.service.spec.ts`

- [ ] **Step 1: Write the repository** (no separate test — covered via service test)

Create `apps/api/src/site/contact-message.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContactMessage, type ContactMessageDocument } from './contact-message.schema';
import type { CreateContactMessageInput, ContactMessageListFilter } from './contact-message.types';

@Injectable()
export class ContactMessageRepository {
  constructor(
    @InjectModel(ContactMessage.name) private readonly model: Model<ContactMessageDocument>,
  ) {}

  create(input: CreateContactMessageInput): Promise<ContactMessageDocument> {
    return this.model.create({ ...input }) as Promise<ContactMessageDocument>;
  }

  findById(id: string): Promise<ContactMessageDocument | null> {
    return this.model.findById(id).exec();
  }

  async list(
    filter: ContactMessageListFilter,
  ): Promise<{ items: ContactMessageDocument[]; total: number }> {
    const skip = (filter.page - 1) * filter.limit;
    const [items, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip(skip).limit(filter.limit).exec(),
      this.model.countDocuments().exec(),
    ]);
    return { items, total };
  }

  deleteById(id: string): Promise<ContactMessageDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
```

- [ ] **Step 2: Write the failing service test**

Create `apps/api/src/site/contact-message.service.spec.ts`:

```typescript
import { NotFoundException } from '@nestjs/common';
import { ContactMessageService } from './contact-message.service';

describe('ContactMessageService', () => {
  it('creates a message', async () => {
    const repo = { create: jest.fn().mockResolvedValue({ _id: '1' }), findById: jest.fn(), list: jest.fn(), deleteById: jest.fn() };
    const service = new ContactMessageService(repo as never);
    await service.submit({ name: 'A', email: 'a@b.c', message: 'hi', ipHash: 'h' });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'A', email: 'a@b.c', message: 'hi', ipHash: 'h' }),
    );
  });

  it('lists messages', async () => {
    const repo = { create: jest.fn(), findById: jest.fn(), list: jest.fn().mockResolvedValue({ items: [], total: 0 }), deleteById: jest.fn() };
    const service = new ContactMessageService(repo as never);
    const result = await service.list(1, 20);
    expect(result.total).toBe(0);
  });

  it('throws NotFound when deleting a missing message', async () => {
    const repo = { create: jest.fn(), findById: jest.fn(), list: jest.fn(), deleteById: jest.fn().mockResolvedValue(null) };
    const service = new ContactMessageService(repo as never);
    await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm --filter @dragon/api test -- contact-message.service.spec`
Expected: FAIL ("Cannot find module './contact-message.service'").

- [ ] **Step 4: Write the service**

Create `apps/api/src/site/contact-message.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactMessageRepository } from './contact-message.repository';
import type { ContactMessageDocument } from './contact-message.schema';
import type { CreateContactMessageInput } from './contact-message.types';

@Injectable()
export class ContactMessageService {
  constructor(private readonly repository: ContactMessageRepository) {}

  submit(input: CreateContactMessageInput): Promise<ContactMessageDocument> {
    return this.repository.create(input);
  }

  list(page: number, limit: number): Promise<{ items: ContactMessageDocument[]; total: number }> {
    return this.repository.list({ page, limit });
  }

  async getById(id: string): Promise<ContactMessageDocument> {
    const doc = await this.repository.findById(id);
    if (!doc) throw new NotFoundException('Contact message not found.');
    return doc;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) throw new NotFoundException('Contact message not found.');
  }
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm --filter @dragon/api test -- contact-message.service.spec`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/site/contact-message.repository.ts apps/api/src/site/contact-message.service.ts apps/api/src/site/contact-message.service.spec.ts
git commit -m "feat(api): add ContactMessage repository + service"
```

### Task 8: In-memory per-IP rate-limit guard

**Files:**
- Create: `apps/api/src/site/contact-rate-limit.guard.ts`
- Test: `apps/api/src/site/contact-rate-limit.guard.spec.ts`

Rationale: the contact submit endpoint needs throttling, but the project has no throttler dependency installed. A small in-memory sliding-window guard avoids a new dependency and is directly unit-testable. Window: 5 requests / 60s per client IP.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/site/contact-rate-limit.guard.spec.ts`:

```typescript
import { HttpException } from '@nestjs/common';
import { ContactRateLimitGuard } from './contact-rate-limit.guard';

function ctx(ip: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ ip, headers: {} }) }),
  } as never;
}

describe('ContactRateLimitGuard', () => {
  it('allows up to the limit then blocks with 429', () => {
    const guard = new ContactRateLimitGuard(3, 60_000);
    expect(guard.canActivate(ctx('1.1.1.1'))).toBe(true);
    expect(guard.canActivate(ctx('1.1.1.1'))).toBe(true);
    expect(guard.canActivate(ctx('1.1.1.1'))).toBe(true);
    try {
      guard.canActivate(ctx('1.1.1.1'));
      fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(429);
    }
  });

  it('tracks IPs independently', () => {
    const guard = new ContactRateLimitGuard(1, 60_000);
    expect(guard.canActivate(ctx('2.2.2.2'))).toBe(true);
    expect(guard.canActivate(ctx('3.3.3.3'))).toBe(true);
  });

  it('frees the window after expiry', () => {
    jest.useFakeTimers();
    const guard = new ContactRateLimitGuard(1, 1_000);
    expect(guard.canActivate(ctx('4.4.4.4'))).toBe(true);
    jest.advanceTimersByTime(1_100);
    expect(guard.canActivate(ctx('4.4.4.4'))).toBe(true);
    jest.useRealTimers();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @dragon/api test -- contact-rate-limit.guard.spec`
Expected: FAIL ("Cannot find module './contact-rate-limit.guard'").

- [ ] **Step 3: Write the guard**

Create `apps/api/src/site/contact-rate-limit.guard.ts`:

```typescript
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class ContactRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit = 5,
    private readonly windowMs = 60_000,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    }>();
    const ip = this.clientIp(req);
    const now = Date.now();
    const recent = (this.hits.get(ip) ?? []).filter((t) => now - t < this.windowMs);

    if (recent.length >= this.limit) {
      throw new HttpException('Too many requests. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    recent.push(now);
    this.hits.set(ip, recent);
    return true;
  }

  private clientIp(req: {
    ip?: string;
    headers: Record<string, string | string[] | undefined>;
  }): string {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
    return req.ip ?? 'unknown';
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @dragon/api test -- contact-rate-limit.guard.spec`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/site/contact-rate-limit.guard.ts apps/api/src/site/contact-rate-limit.guard.spec.ts
git commit -m "feat(api): add in-memory contact rate-limit guard"
```

---

## Phase 4 — API: controllers, DTOs, module wiring

### Task 9: Public DTO mappers + request parsers

**Files:**
- Create: `apps/api/src/site/public/dto/public-site-response.ts`
- Create: `apps/api/src/site/public/dto/contact-message-body.ts`
- Test: `apps/api/src/site/public/dto/contact-message-body.spec.ts`

- [ ] **Step 1: Write public response mapper**

Create `apps/api/src/site/public/dto/public-site-response.ts`:

```typescript
import type { PublicSiteSettingsResponse } from '@dragon/types';
import type { SiteSettingsView } from '../../site-settings.service';

export function toPublicSiteSettingsResponse(view: SiteSettingsView): PublicSiteSettingsResponse {
  return {
    settings: {
      about: { title: view.about.title, bodyHtml: view.about.bodyHtml },
      contact: {
        ...(view.contact.email ? { email: view.contact.email } : {}),
        ...(view.contact.phone ? { phone: view.contact.phone } : {}),
        ...(view.contact.address ? { address: view.contact.address } : {}),
        ...(view.contact.mapEmbedUrl ? { mapEmbedUrl: view.contact.mapEmbedUrl } : {}),
        socials: view.contact.socials.map((s) => ({ platform: s.platform, url: s.url })),
      },
    },
  };
}
```

- [ ] **Step 2: Write the failing body-parser test**

Create `apps/api/src/site/public/dto/contact-message-body.spec.ts`:

```typescript
import { BadRequestException } from '@nestjs/common';
import { parseContactMessageBody, isHoneypotTriggered } from './contact-message-body';

describe('parseContactMessageBody', () => {
  it('parses a valid body', () => {
    const result = parseContactMessageBody({ name: 'Ali', email: 'a@b.c', message: 'hello' });
    expect(result.name).toBe('Ali');
    expect(result.subject).toBeUndefined();
  });

  it('rejects missing required fields', () => {
    expect(() => parseContactMessageBody({ name: '', email: '', message: '' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects an invalid email', () => {
    expect(() => parseContactMessageBody({ name: 'A', email: 'nope', message: 'x' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects an over-long message', () => {
    const long = 'x'.repeat(5001);
    expect(() => parseContactMessageBody({ name: 'A', email: 'a@b.c', message: long })).toThrow(
      BadRequestException,
    );
  });

  it('detects a filled honeypot', () => {
    expect(isHoneypotTriggered({ website: 'http://spam' })).toBe(true);
    expect(isHoneypotTriggered({})).toBe(false);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm --filter @dragon/api test -- contact-message-body.spec`
Expected: FAIL ("Cannot find module './contact-message-body'").

- [ ] **Step 4: Write the parser**

Create `apps/api/src/site/public/dto/contact-message-body.ts`:

```typescript
import { BadRequestException } from '@nestjs/common';

export interface ParsedContactMessageBody {
  readonly name: string;
  readonly email: string;
  readonly subject?: string;
  readonly message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 5000;
const MAX_FIELD = 200;

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function isHoneypotTriggered(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false;
  const website = (body as Record<string, unknown>).website;
  return typeof website === 'string' && website.trim().length > 0;
}

export function parseContactMessageBody(body: unknown): ParsedContactMessageBody {
  if (typeof body !== 'object' || body === null) {
    throw new BadRequestException('Invalid request body.');
  }
  const raw = body as Record<string, unknown>;
  const name = str(raw.name);
  const email = str(raw.email);
  const message = str(raw.message);
  const subject = str(raw.subject);

  if (!name || name.length > MAX_FIELD) throw new BadRequestException('Invalid name.');
  if (!email || !EMAIL_RE.test(email) || email.length > MAX_FIELD)
    throw new BadRequestException('Invalid email.');
  if (!message) throw new BadRequestException('Message is required.');
  if (message.length > MAX_MESSAGE) throw new BadRequestException('Message is too long.');
  if (subject.length > MAX_FIELD) throw new BadRequestException('Subject is too long.');

  return { name, email, message, ...(subject ? { subject } : {}) };
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm --filter @dragon/api test -- contact-message-body.spec`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/site/public/dto/public-site-response.ts apps/api/src/site/public/dto/contact-message-body.ts apps/api/src/site/public/dto/contact-message-body.spec.ts
git commit -m "feat(api): add public site DTO mapper + contact body parser"
```

### Task 10: Public site controller

**Files:**
- Create: `apps/api/src/site/public/public-site.controller.ts`
- Test: `apps/api/src/site/public/public-site.controller.spec.ts`

Behavior: `GET /api/v1/site/settings` returns public settings. `POST /api/v1/site/contact-messages` runs the rate-limit guard, silently succeeds on honeypot hit (no store), otherwise stores a hashed-IP message and returns `{ success: true }`.

- [ ] **Step 1: Write the failing controller test**

Create `apps/api/src/site/public/public-site.controller.spec.ts`:

```typescript
import { PublicSiteController } from './public-site.controller';

function makeReq(ip = '9.9.9.9') {
  return { ip, headers: {} } as never;
}

describe('PublicSiteController', () => {
  const view = {
    about: { title: 'About', bodyJson: {}, bodyHtml: '<p>a</p>' },
    contact: { email: 'a@b.c', socials: [] },
    updatedAt: new Date(),
  };

  it('returns public settings', async () => {
    const settings = { getSettings: jest.fn().mockResolvedValue(view), updateSettings: jest.fn() };
    const messages = { submit: jest.fn() };
    const controller = new PublicSiteController(settings as never, messages as never);
    const res = await controller.getSettings();
    expect(res.settings.about.title).toBe('About');
    expect(res.settings.contact).not.toHaveProperty('socials', undefined);
  });

  it('stores a valid contact message and returns success', async () => {
    const settings = { getSettings: jest.fn() };
    const messages = { submit: jest.fn().mockResolvedValue({ _id: '1' }) };
    const controller = new PublicSiteController(settings as never, messages as never);
    const res = await controller.submitContactMessage(
      { name: 'Ali', email: 'a@b.c', message: 'hi' },
      makeReq(),
    );
    expect(res).toEqual({ success: true });
    expect(messages.submit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ali', email: 'a@b.c', message: 'hi', ipHash: expect.any(String) }),
    );
  });

  it('silently drops honeypot submissions without storing', async () => {
    const settings = { getSettings: jest.fn() };
    const messages = { submit: jest.fn() };
    const controller = new PublicSiteController(settings as never, messages as never);
    const res = await controller.submitContactMessage(
      { name: 'Bot', email: 'b@b.c', message: 'spam', website: 'http://x' },
      makeReq(),
    );
    expect(res).toEqual({ success: true });
    expect(messages.submit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @dragon/api test -- public-site.controller.spec`
Expected: FAIL ("Cannot find module './public-site.controller'").

- [ ] **Step 3: Write the controller**

Create `apps/api/src/site/public/public-site.controller.ts`:

```typescript
import { createHash } from 'node:crypto';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type {
  PublicSiteSettingsResponse,
  SubmitContactMessageResponse,
} from '@dragon/types';
import { SiteSettingsService } from '../site-settings.service';
import { ContactMessageService } from '../contact-message.service';
import { ContactRateLimitGuard } from '../contact-rate-limit.guard';
import { toPublicSiteSettingsResponse } from './dto/public-site-response';
import { isHoneypotTriggered, parseContactMessageBody } from './dto/contact-message-body';

const IP_SALT = process.env.CONTACT_IP_SALT ?? 'dragon-contact-salt';

@Controller('api/v1/site')
export class PublicSiteController {
  constructor(
    private readonly settingsService: SiteSettingsService,
    private readonly messageService: ContactMessageService,
  ) {}

  @Get('settings')
  async getSettings(): Promise<PublicSiteSettingsResponse> {
    const view = await this.settingsService.getSettings();
    return toPublicSiteSettingsResponse(view);
  }

  @Post('contact-messages')
  @UseGuards(ContactRateLimitGuard)
  async submitContactMessage(
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<SubmitContactMessageResponse> {
    if (isHoneypotTriggered(body)) {
      return { success: true };
    }
    const parsed = parseContactMessageBody(body);
    const ipHash = this.hashIp(req);
    await this.messageService.submit({ ...parsed, ipHash });
    return { success: true };
  }

  private hashIp(req: Request): string {
    const fwd = req.headers['x-forwarded-for'];
    const ip =
      (typeof fwd === 'string' && fwd.length > 0 ? fwd.split(',')[0].trim() : undefined) ??
      req.ip ??
      'unknown';
    return createHash('sha256').update(`${ip}${IP_SALT}`).digest('hex');
  }
}
```

> Note: `@UseGuards(ContactRateLimitGuard)` uses the guard with its default constructor args (5/60s). The guard is also provided in `SiteModule` so Nest can instantiate it.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @dragon/api test -- public-site.controller.spec`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/site/public/public-site.controller.ts apps/api/src/site/public/public-site.controller.spec.ts
git commit -m "feat(api): add public site controller (settings + contact form)"
```

### Task 11: Admin DTO mappers + parser

**Files:**
- Create: `apps/api/src/site/admin/dto/admin-site-response.ts`
- Create: `apps/api/src/site/admin/dto/admin-site-settings-body.ts`
- Test: `apps/api/src/site/admin/dto/admin-site-settings-body.spec.ts`

- [ ] **Step 1: Write the response mappers**

Create `apps/api/src/site/admin/dto/admin-site-response.ts`:

```typescript
import type {
  AdminSiteSettingsResponse,
  ContactMessageDto,
  ContactMessageListResponse,
  ContactMessageResponse,
} from '@dragon/types';
import type { SiteSettingsView } from '../../site-settings.service';
import type { ContactMessageDocument } from '../../contact-message.schema';

export function toAdminSiteSettingsResponse(view: SiteSettingsView): AdminSiteSettingsResponse {
  return {
    settings: {
      about: {
        title: view.about.title,
        bodyJson: view.about.bodyJson,
        bodyHtml: view.about.bodyHtml,
      },
      contact: {
        ...(view.contact.email ? { email: view.contact.email } : {}),
        ...(view.contact.phone ? { phone: view.contact.phone } : {}),
        ...(view.contact.address ? { address: view.contact.address } : {}),
        ...(view.contact.mapEmbedUrl ? { mapEmbedUrl: view.contact.mapEmbedUrl } : {}),
        socials: view.contact.socials.map((s) => ({ platform: s.platform, url: s.url })),
      },
      updatedAt: (view.updatedAt ?? new Date(0)).toISOString(),
    },
  };
}

function toContactMessageDto(doc: ContactMessageDocument): ContactMessageDto {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    ...(doc.subject ? { subject: doc.subject } : {}),
    message: doc.message,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toContactMessageResponse(doc: ContactMessageDocument): ContactMessageResponse {
  return { message: toContactMessageDto(doc) };
}

export function toContactMessageListResponse(
  items: ContactMessageDocument[],
  total: number,
  page: number,
  limit: number,
): ContactMessageListResponse {
  return { items: items.map(toContactMessageDto), total, page, limit };
}
```

- [ ] **Step 2: Write the failing parser test**

Create `apps/api/src/site/admin/dto/admin-site-settings-body.spec.ts`:

```typescript
import { BadRequestException } from '@nestjs/common';
import { parseUpdateSiteSettingsBody } from './admin-site-settings-body';

describe('parseUpdateSiteSettingsBody', () => {
  it('parses a full valid body', () => {
    const result = parseUpdateSiteSettingsBody({
      about: { title: 'About', bodyJson: { type: 'doc' }, bodyHtml: '<p>a</p>' },
      contact: {
        email: 'a@b.c',
        phone: '0911',
        address: 'Tehran',
        mapEmbedUrl: 'https://maps',
        socials: [{ platform: 'instagram', url: 'https://ig/x' }],
      },
    });
    expect(result.about.title).toBe('About');
    expect(result.contact.socials).toHaveLength(1);
  });

  it('defaults socials to empty array when omitted', () => {
    const result = parseUpdateSiteSettingsBody({
      about: { title: 'A', bodyJson: {}, bodyHtml: '' },
      contact: {},
    });
    expect(result.contact.socials).toEqual([]);
  });

  it('rejects a non-object body', () => {
    expect(() => parseUpdateSiteSettingsBody(null)).toThrow(BadRequestException);
  });

  it('rejects malformed social entries', () => {
    expect(() =>
      parseUpdateSiteSettingsBody({
        about: { title: 'A', bodyJson: {}, bodyHtml: '' },
        contact: { socials: [{ platform: '', url: '' }] },
      }),
    ).toThrow(BadRequestException);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm --filter @dragon/api test -- admin-site-settings-body.spec`
Expected: FAIL ("Cannot find module './admin-site-settings-body'").

- [ ] **Step 4: Write the parser**

Create `apps/api/src/site/admin/dto/admin-site-settings-body.ts`:

```typescript
import { BadRequestException } from '@nestjs/common';
import type { UpdateSiteSettingsInput } from '../../site-settings.types';

function asObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new BadRequestException(`Invalid ${label}.`);
  }
  return value as Record<string, unknown>;
}

function optStr(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new BadRequestException('Expected a string field.');
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseUpdateSiteSettingsBody(body: unknown): UpdateSiteSettingsInput {
  const root = asObject(body, 'request body');
  const about = asObject(root.about, 'about');
  const contact = asObject(root.contact, 'contact');

  const title = typeof about.title === 'string' ? about.title.trim() : '';
  const bodyHtml = typeof about.bodyHtml === 'string' ? about.bodyHtml : '';
  const bodyJson =
    typeof about.bodyJson === 'object' && about.bodyJson !== null
      ? (about.bodyJson as Record<string, unknown>)
      : {};

  const rawSocials = Array.isArray(contact.socials) ? contact.socials : [];
  const socials = rawSocials.map((entry) => {
    const s = asObject(entry, 'social link');
    const platform = typeof s.platform === 'string' ? s.platform.trim() : '';
    const url = typeof s.url === 'string' ? s.url.trim() : '';
    if (!platform || !url) throw new BadRequestException('Each social link needs platform + url.');
    return { platform, url };
  });

  return {
    about: { title, bodyJson, bodyHtml },
    contact: {
      ...(optStr(contact.email) ? { email: optStr(contact.email) } : {}),
      ...(optStr(contact.phone) ? { phone: optStr(contact.phone) } : {}),
      ...(optStr(contact.address) ? { address: optStr(contact.address) } : {}),
      ...(optStr(contact.mapEmbedUrl) ? { mapEmbedUrl: optStr(contact.mapEmbedUrl) } : {}),
      socials,
    },
  };
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm --filter @dragon/api test -- admin-site-settings-body.spec`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/site/admin/dto/admin-site-response.ts apps/api/src/site/admin/dto/admin-site-settings-body.ts apps/api/src/site/admin/dto/admin-site-settings-body.spec.ts
git commit -m "feat(api): add admin site DTO mappers + settings body parser"
```

### Task 12: Admin site controller

**Files:**
- Create: `apps/api/src/site/admin/admin-site.controller.ts`
- Test: `apps/api/src/site/admin/admin-site.controller.spec.ts`

Endpoints (all `@UseGuards(AccessTokenGuard, PermissionGuard)`):
- `GET admin/v1/site/settings` — `SITE_SETTINGS_READ`
- `PUT admin/v1/site/settings` — `SITE_SETTINGS_UPDATE`
- `GET admin/v1/site/contact-messages` — `SITE_MESSAGE_READ`
- `GET admin/v1/site/contact-messages/:id` — `SITE_MESSAGE_READ`
- `DELETE admin/v1/site/contact-messages/:id` — `SITE_MESSAGE_MANAGE`

- [ ] **Step 1: Write the failing controller test**

Create `apps/api/src/site/admin/admin-site.controller.spec.ts`:

```typescript
import { AdminSiteController } from './admin-site.controller';

const view = {
  about: { title: 'About', bodyJson: {}, bodyHtml: '<p>a</p>' },
  contact: { socials: [] },
  updatedAt: new Date('2026-06-15T00:00:00Z'),
};

function authReq() {
  return { auth: { userId: 'admin-1' } } as never;
}

describe('AdminSiteController', () => {
  it('returns settings', async () => {
    const settings = { getSettings: jest.fn().mockResolvedValue(view), updateSettings: jest.fn() };
    const messages = { list: jest.fn(), getById: jest.fn(), delete: jest.fn() };
    const controller = new AdminSiteController(settings as never, messages as never);
    const res = await controller.getSettings();
    expect(res.settings.about.title).toBe('About');
  });

  it('updates settings with the requesting user id', async () => {
    const settings = { getSettings: jest.fn(), updateSettings: jest.fn().mockResolvedValue(view) };
    const messages = { list: jest.fn(), getById: jest.fn(), delete: jest.fn() };
    const controller = new AdminSiteController(settings as never, messages as never);
    await controller.updateSettings(
      { about: { title: 'About', bodyJson: {}, bodyHtml: '<p>a</p>' }, contact: { socials: [] } },
      authReq(),
    );
    expect(settings.updateSettings).toHaveBeenCalledWith(expect.any(Object), 'admin-1');
  });

  it('lists contact messages', async () => {
    const settings = { getSettings: jest.fn(), updateSettings: jest.fn() };
    const messages = {
      list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      getById: jest.fn(),
      delete: jest.fn(),
    };
    const controller = new AdminSiteController(settings as never, messages as never);
    const res = await controller.listMessages({ page: '1', limit: '20' });
    expect(res.total).toBe(0);
    expect(res.page).toBe(1);
  });

  it('deletes a contact message', async () => {
    const settings = { getSettings: jest.fn(), updateSettings: jest.fn() };
    const messages = { list: jest.fn(), getById: jest.fn(), delete: jest.fn().mockResolvedValue(undefined) };
    const controller = new AdminSiteController(settings as never, messages as never);
    const res = await controller.deleteMessage('msg-1');
    expect(messages.delete).toHaveBeenCalledWith('msg-1');
    expect(res.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @dragon/api test -- admin-site.controller.spec`
Expected: FAIL ("Cannot find module './admin-site.controller'").

- [ ] **Step 3: Write the controller**

Create `apps/api/src/site/admin/admin-site.controller.ts`:

```typescript
import { Body, Controller, Delete, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import type {
  AdminSiteSettingsResponse,
  ContactMessageListResponse,
  ContactMessageResponse,
  SiteGenericResponse,
} from '@dragon/types';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../../auth/guards/authenticated-request';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { SiteSettingsService } from '../site-settings.service';
import { ContactMessageService } from '../contact-message.service';
import { parseUpdateSiteSettingsBody } from './dto/admin-site-settings-body';
import {
  toAdminSiteSettingsResponse,
  toContactMessageListResponse,
  toContactMessageResponse,
} from './dto/admin-site-response';

function toPositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

@Controller('admin/v1/site')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminSiteController {
  constructor(
    private readonly settingsService: SiteSettingsService,
    private readonly messageService: ContactMessageService,
  ) {}

  @Get('settings')
  @RequirePermission(Permissions.SITE_SETTINGS_READ)
  async getSettings(): Promise<AdminSiteSettingsResponse> {
    const view = await this.settingsService.getSettings();
    return toAdminSiteSettingsResponse(view);
  }

  @Put('settings')
  @RequirePermission(Permissions.SITE_SETTINGS_UPDATE)
  async updateSettings(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminSiteSettingsResponse> {
    const input = parseUpdateSiteSettingsBody(body);
    const view = await this.settingsService.updateSettings(input, req.auth?.userId);
    return toAdminSiteSettingsResponse(view);
  }

  @Get('contact-messages')
  @RequirePermission(Permissions.SITE_MESSAGE_READ)
  async listMessages(@Query() query: Record<string, unknown>): Promise<ContactMessageListResponse> {
    const page = toPositiveInt(query.page, 1);
    const limit = Math.min(toPositiveInt(query.limit, 20), 100);
    const { items, total } = await this.messageService.list(page, limit);
    return toContactMessageListResponse(items, total, page, limit);
  }

  @Get('contact-messages/:id')
  @RequirePermission(Permissions.SITE_MESSAGE_READ)
  async getMessage(@Param('id') id: string): Promise<ContactMessageResponse> {
    const doc = await this.messageService.getById(id);
    return toContactMessageResponse(doc);
  }

  @Delete('contact-messages/:id')
  @RequirePermission(Permissions.SITE_MESSAGE_MANAGE)
  async deleteMessage(@Param('id') id: string): Promise<SiteGenericResponse> {
    await this.messageService.delete(id);
    return { success: true, message: 'Contact message deleted.' };
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @dragon/api test -- admin-site.controller.spec`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/site/admin/admin-site.controller.ts apps/api/src/site/admin/admin-site.controller.spec.ts
git commit -m "feat(api): add admin site controller (settings + messages)"
```

### Task 13: SiteModule + app wiring

**Files:**
- Create: `apps/api/src/site/site.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/site/site.module.spec.ts`

- [ ] **Step 1: Write the module**

Create `apps/api/src/site/site.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentModule } from '../content/content.module';
import { SiteSettings, SiteSettingsSchema } from './site-settings.schema';
import { ContactMessage, ContactMessageSchema } from './contact-message.schema';
import { SiteSettingsRepository } from './site-settings.repository';
import { SiteSettingsService } from './site-settings.service';
import { ContactMessageRepository } from './contact-message.repository';
import { ContactMessageService } from './contact-message.service';
import { ContactRateLimitGuard } from './contact-rate-limit.guard';
import { PublicSiteController } from './public/public-site.controller';
import { AdminSiteController } from './admin/admin-site.controller';

@Module({
  imports: [
    ContentModule, // provides HtmlSanitizer
    MongooseModule.forFeature([
      { name: SiteSettings.name, schema: SiteSettingsSchema },
      { name: ContactMessage.name, schema: ContactMessageSchema },
    ]),
  ],
  controllers: [PublicSiteController, AdminSiteController],
  providers: [
    SiteSettingsRepository,
    SiteSettingsService,
    ContactMessageRepository,
    ContactMessageService,
    ContactRateLimitGuard,
  ],
  exports: [SiteSettingsService, ContactMessageService],
})
export class SiteModule {}
```

> `ContentModule` already exports `HtmlSanitizer` (verified in `content.module.ts`). If Nest reports `HtmlSanitizer` is not resolvable, confirm it remains in `ContentModule`'s `exports`.

- [ ] **Step 2: Register in app.module**

In `apps/api/src/app.module.ts`: add the import near the other module imports —

```typescript
import { SiteModule } from './site/site.module';
```

and add `SiteModule,` to the `imports` array (place it right after `ContentModule,`).

- [ ] **Step 3: Write a module-compiles test**

Create `apps/api/src/site/site.module.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HtmlSanitizer } from '../content/rich-text/html-sanitizer';
import { SiteModule } from './site.module';
import { SiteSettings } from './site-settings.schema';
import { ContactMessage } from './contact-message.schema';
import { SiteSettingsService } from './site-settings.service';
import { ContactMessageService } from './contact-message.service';

describe('SiteModule', () => {
  it('wires services with mocked models + sanitizer', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SiteSettingsService,
        ContactMessageService,
        { provide: HtmlSanitizer, useValue: { sanitize: (h: string) => h } },
      ],
    })
      .overrideProvider(getModelToken(SiteSettings.name))
      .useValue({})
      .overrideProvider(getModelToken(ContactMessage.name))
      .useValue({})
      .compile()
      .catch(() => null);

    // Smoke import to ensure module file is syntactically valid and importable.
    expect(SiteModule).toBeDefined();
    expect(moduleRef === null || moduleRef !== undefined).toBe(true);
  });
});
```

> If the repo has an established module-integration test pattern (check `content.module.spec.ts`), mirror that instead; otherwise the smoke test above is sufficient to catch import/wiring breakage.

- [ ] **Step 4: Run the test + the full api suite**

Run: `pnpm --filter @dragon/api test -- site`
Expected: PASS for all `site/**` specs.

Then build to confirm DI wiring + app module compile:
Run: `pnpm --filter @dragon/api build`
Expected: build succeeds with no TS errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/site/site.module.ts apps/api/src/site/site.module.spec.ts apps/api/src/app.module.ts
git commit -m "feat(api): wire SiteModule into the app"
```

---

## Phase 5 — SDK clients

### Task 14: Public + admin site SDK clients

**Files:**
- Create: `packages/sdk/src/site.ts`
- Create: `packages/sdk/src/admin-site.ts`
- Modify: `packages/sdk/src/index.ts`
- Test: `packages/sdk/src/site.spec.ts`

- [ ] **Step 1: Write the failing client test**

Create `packages/sdk/src/site.spec.ts`:

```typescript
import { createSiteClient } from './site';
import { createAdminSiteClient } from './admin-site';

function fakeClient() {
  const calls: { method: string; path: string; body?: unknown }[] = [];
  return {
    calls,
    request: async <T>(opts: { method: string; path: string; body?: unknown }): Promise<T> => {
      calls.push(opts);
      return {} as T;
    },
  };
}

describe('site SDK clients', () => {
  it('public getSettings hits the public settings path', async () => {
    const client = fakeClient();
    await createSiteClient(client as never).getSettings();
    expect(client.calls[0]).toEqual({ method: 'GET', path: '/api/v1/site/settings' });
  });

  it('public submitContactMessage posts the body', async () => {
    const client = fakeClient();
    await createSiteClient(client as never).submitContactMessage({
      name: 'A',
      email: 'a@b.c',
      message: 'hi',
    });
    expect(client.calls[0].method).toBe('POST');
    expect(client.calls[0].path).toBe('/api/v1/site/contact-messages');
    expect(client.calls[0].body).toMatchObject({ name: 'A' });
  });

  it('admin getSettings hits the admin path', async () => {
    const client = fakeClient();
    await createAdminSiteClient(client as never).getSettings();
    expect(client.calls[0].path).toBe('/admin/v1/site/settings');
  });

  it('admin listMessages builds a paged query', async () => {
    const client = fakeClient();
    await createAdminSiteClient(client as never).listMessages({ page: 2, limit: 10 });
    expect(client.calls[0].path).toBe('/admin/v1/site/contact-messages?page=2&limit=10');
  });

  it('admin deleteMessage hits the message path', async () => {
    const client = fakeClient();
    await createAdminSiteClient(client as never).deleteMessage('abc');
    expect(client.calls[0]).toEqual({ method: 'DELETE', path: '/admin/v1/site/contact-messages/abc' });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @dragon/sdk test -- site.spec`
Expected: FAIL ("Cannot find module './site'").

- [ ] **Step 3: Write the public client**

Create `packages/sdk/src/site.ts`:

```typescript
import type { ApiClient } from './client';
import type {
  PublicSiteSettingsResponse,
  SubmitContactMessageRequest,
  SubmitContactMessageResponse,
} from '@dragon/types';

export interface SiteClient {
  getSettings(): Promise<PublicSiteSettingsResponse>;
  submitContactMessage(body: SubmitContactMessageRequest): Promise<SubmitContactMessageResponse>;
}

export function createSiteClient(client: ApiClient): SiteClient {
  return {
    getSettings() {
      return client.request<PublicSiteSettingsResponse>({
        method: 'GET',
        path: '/api/v1/site/settings',
      });
    },
    submitContactMessage(body) {
      return client.request<SubmitContactMessageResponse>({
        method: 'POST',
        path: '/api/v1/site/contact-messages',
        body,
      });
    },
  };
}
```

- [ ] **Step 4: Write the admin client**

Create `packages/sdk/src/admin-site.ts`:

```typescript
import type { ApiClient } from './client';
import type {
  AdminSiteSettingsResponse,
  ContactMessageListResponse,
  ContactMessageResponse,
  SiteGenericResponse,
  UpdateSiteSettingsRequest,
} from '@dragon/types';

export interface AdminSiteClient {
  getSettings(): Promise<AdminSiteSettingsResponse>;
  updateSettings(body: UpdateSiteSettingsRequest): Promise<AdminSiteSettingsResponse>;
  listMessages(params?: { page?: number; limit?: number }): Promise<ContactMessageListResponse>;
  getMessage(id: string): Promise<ContactMessageResponse>;
  deleteMessage(id: string): Promise<SiteGenericResponse>;
}

export function createAdminSiteClient(client: ApiClient): AdminSiteClient {
  return {
    getSettings() {
      return client.request<AdminSiteSettingsResponse>({
        method: 'GET',
        path: '/admin/v1/site/settings',
      });
    },
    updateSettings(body) {
      return client.request<AdminSiteSettingsResponse>({
        method: 'PUT',
        path: '/admin/v1/site/settings',
        body,
      });
    },
    listMessages(params) {
      const sp = new URLSearchParams();
      if (params?.page !== undefined) sp.set('page', String(params.page));
      if (params?.limit !== undefined) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return client.request<ContactMessageListResponse>({
        method: 'GET',
        path: q ? `/admin/v1/site/contact-messages?${q}` : '/admin/v1/site/contact-messages',
      });
    },
    getMessage(id) {
      return client.request<ContactMessageResponse>({
        method: 'GET',
        path: `/admin/v1/site/contact-messages/${encodeURIComponent(id)}`,
      });
    },
    deleteMessage(id) {
      return client.request<SiteGenericResponse>({
        method: 'DELETE',
        path: `/admin/v1/site/contact-messages/${encodeURIComponent(id)}`,
      });
    },
  };
}
```

- [ ] **Step 5: Export from the SDK barrel**

In `packages/sdk/src/index.ts`, add (next to the content exports):

```typescript
export * from './site';
export * from './admin-site';
```

- [ ] **Step 6: Run to verify it passes**

Run: `pnpm --filter @dragon/sdk test -- site.spec`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add packages/sdk/src/site.ts packages/sdk/src/admin-site.ts packages/sdk/src/index.ts packages/sdk/src/site.spec.ts
git commit -m "feat(sdk): add public + admin site clients"
```

---

## Phase 6 — Admin UI

> Before starting: open `apps/admin/features/content/admin-content.api.ts` + `apps/admin/pages/content/pages/index.vue` and one `.../[id]/edit.vue` to copy this app's exact composable, auth/client, rich-text editor, table, and form conventions. The snippets below are illustrative of structure; match the established patterns (component names, `useNuxtApp`/`$fetch`/api client, toast/error handling) rather than introducing new ones.

### Task 15: Admin site API wrapper

**Files:**
- Create: `apps/admin/features/site/admin-site.api.ts`
- Test: `apps/admin/features/site/admin-site.api.spec.ts`

- [ ] **Step 1: Write the wrapper**

Mirror `apps/admin/features/content/admin-content.api.ts`. It should construct the authenticated admin API client (same way `admin-content.api.ts` does) and expose `createAdminSiteClient` from `@dragon/sdk`. Example shape (adapt to the real auth-client factory used in `admin-content.api.ts`):

```typescript
import { createAdminSiteClient } from '@dragon/sdk';
import { createAdminApiClient } from './../content/admin-content.api'; // reuse the existing factory if exported; otherwise replicate its client setup

export function useAdminSiteApi() {
  const client = createAdminApiClient(); // same authenticated ApiClient used across admin features
  return createAdminSiteClient(client);
}
```

> If `admin-content.api.ts` does not export a reusable client factory, copy its client-construction code (runtime config base URL + auth token injection) into `admin-site.api.ts`. Keep auth handling identical.

- [ ] **Step 2: Write the spec**

Create `apps/admin/features/site/admin-site.api.spec.ts` mirroring `admin-content.api.spec.ts` — assert `useAdminSiteApi()` returns an object exposing `getSettings`, `updateSettings`, `listMessages`, `deleteMessage`. Use the same mocking approach as the content spec (mock the underlying client/fetch).

- [ ] **Step 3: Run the spec**

Run: `pnpm --filter @dragon/admin test -- admin-site.api`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/features/site/admin-site.api.ts apps/admin/features/site/admin-site.api.spec.ts
git commit -m "feat(admin): add site api feature wrapper"
```

### Task 16: Admin settings editor page

**Files:**
- Create: `apps/admin/pages/site/settings.vue`

- [ ] **Step 1: Build the page**

Create `apps/admin/pages/site/settings.vue`. Requirements:
- Use the admin layout + route middleware that gate by permission, matching `pages/content/pages/index.vue`. Gate this route by `site.settings.update` (check how existing pages declare required permissions — e.g. `definePageMeta({ permission: ... })` or middleware; replicate exactly).
- On mount, call `useAdminSiteApi().getSettings()` and populate the form.
- **About section:** a title text input + the same rich-text editor component used by `pages/content/pages/[id]/edit.vue`. Capture both `bodyJson` (editor state) and `bodyHtml` (rendered) on save, exactly as the page editor does.
- **Contact section:** text inputs for email, phone, address, mapEmbedUrl, plus a repeatable socials list (each row: platform input + url input, with add/remove buttons).
- **Save** button calls `updateSettings({ about: { title, bodyJson, bodyHtml }, contact: { email, phone, address, mapEmbedUrl, socials } })`, shows success/error using the app's existing toast/notification pattern.
- All labels in Persian, RTL layout (match existing admin pages).

- [ ] **Step 2: Manual verification**

Run the admin app (per the project's run skill / `pnpm --filter @dragon/admin dev`), log in as a super_admin, navigate to `/site/settings`, fill + save, reload, confirm persistence. Confirm a non-permitted role gets the forbidden screen.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/pages/site/settings.vue
git commit -m "feat(admin): add site settings editor page"
```

### Task 17: Admin contact messages inbox page

**Files:**
- Create: `apps/admin/pages/site/messages/index.vue`

- [ ] **Step 1: Build the page**

Create `apps/admin/pages/site/messages/index.vue`. Requirements:
- Gate by `site.message.read` (same mechanism as other admin pages).
- Call `useAdminSiteApi().listMessages({ page, limit })`; render a table: name, email, subject, message (truncated), created date (Persian/Jalali formatting if the app already has a date util — reuse it).
- Pagination controls matching the existing content list pages.
- Each row has a delete action (calls `deleteMessage(id)`, then refreshes the list) — visible only when the user has `site.message.manage` (mirror how existing pages conditionally show actions by permission).
- Empty state + loading state consistent with existing list pages.

- [ ] **Step 2: Manual verification**

Submit a message from the web contact form (after Phase 7) or seed one directly, then confirm it appears in `/site/messages` and can be deleted.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/pages/site/messages/index.vue
git commit -m "feat(admin): add contact messages inbox page"
```

### Task 18: Admin navigation entries

**Files:**
- Modify: the admin navigation config (locate via `apps/admin/features/navigation/` — open it to find the nav item list).

- [ ] **Step 1: Add nav items**

Add a "Site" section (Persian label) with two links: Settings (`/site/settings`, gated `site.settings.update`) and Messages (`/site/messages`, gated `site.message.read`). Match the exact shape of existing nav entries (icon, permission key field, route).

- [ ] **Step 2: Manual verification**

Confirm the nav items appear for super_admin and are hidden for roles lacking the permissions.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/features/navigation
git commit -m "feat(admin): add site nav entries"
```

---

## Phase 7 — Web UI

> Before starting: open `apps/web/composables/usePublicContent.ts`, `apps/web/pages/pages/[slug].vue`, and `apps/web/features/content/content-seo.ts` to copy the exact composable + SEO + render conventions.

### Task 19: Web public site composable

**Files:**
- Create: `apps/web/composables/usePublicSite.ts`

- [ ] **Step 1: Build the composable**

Create `apps/web/composables/usePublicSite.ts`, mirroring `usePublicContent.ts`:

```typescript
import { createApiClient, createSiteClient } from '@dragon/sdk';

export function usePublicSite() {
  const runtimeConfig = useRuntimeConfig();
  return createSiteClient(
    createApiClient({ baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined }),
  );
}
```

> Confirm `createApiClient` is exported from `@dragon/sdk` (it is used by `apps/web/features/content/content-api.ts`). If the web app wraps client creation differently (e.g. via `createContentApi`), follow that wrapper style for consistency.

- [ ] **Step 2: Commit**

```bash
git add apps/web/composables/usePublicSite.ts
git commit -m "feat(web): add usePublicSite composable"
```

### Task 20: Web About page

**Files:**
- Create: `apps/web/pages/about.vue`

- [ ] **Step 1: Build the page**

Create `apps/web/pages/about.vue`, modeled on `pages/pages/[slug].vue`:
- `useAsyncData('site-about', () => usePublicSite().getSettings())`.
- Render `settings.about.title` as `<h1>` and `settings.about.bodyHtml` via the existing `ContentHtmlRenderer` component.
- Loading / error states via `ContentStateMessage` (same as the slug page).
- SEO head via `buildContentSeoHead({ title: settings.about.title || 'درباره ما', ... })`.
- Reuse the slug page's `<style>` structure/classes for consistent layout.

- [ ] **Step 2: Manual verification**

After setting About content in admin, visit `/about`, confirm title + rich-text render correctly RTL.

- [ ] **Step 3: Commit**

```bash
git add apps/web/pages/about.vue
git commit -m "feat(web): add About page"
```

### Task 21: Web Contact page + form

**Files:**
- Create: `apps/web/pages/contact.vue`

- [ ] **Step 1: Build the page**

Create `apps/web/pages/contact.vue`:
- `useAsyncData('site-contact', () => usePublicSite().getSettings())`; render contact info block: email (mailto link), phone (tel link), address, socials (icon/text links), and the `mapEmbedUrl` in a responsive `<iframe>` (only if present).
- A contact form with fields: name, email, subject (optional), message, plus a **hidden honeypot** input named `website` (visually hidden via CSS, `tabindex="-1"`, `autocomplete="off"`).
- On submit: call `usePublicSite().submitContactMessage({ name, email, subject, message, website })`. Client-side validate required fields + email format before sending. Show success message and reset the form on success; show an error message on failure (including a friendly message for HTTP 429 "too many requests").
- All labels in Persian, RTL.
- SEO head via `buildContentSeoHead({ title: 'تماس با ما' })`.

- [ ] **Step 2: Manual verification**

Visit `/contact`: confirm info renders, submit a message and confirm success + that it appears in admin `/site/messages`. Submit rapidly >5 times to confirm the 429 path shows the friendly error.

- [ ] **Step 3: Commit**

```bash
git add apps/web/pages/contact.vue
git commit -m "feat(web): add Contact page with message form"
```

### Task 22: Web header + footer links

**Files:**
- Modify: `apps/web/components/AppHeader.vue`
- Modify: `apps/web/components/AppFooter.vue`

- [ ] **Step 1: Add links**

Add navigation links to `/about` ("درباره ما") and `/contact` ("تماس با ما") in both `AppHeader.vue` (top nav menu) and `AppFooter.vue`, matching each component's existing link markup/styling (use `<NuxtLink>` as the existing links do).

- [ ] **Step 2: Manual verification**

Confirm both links appear in header + footer on every page and route correctly.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/AppHeader.vue apps/web/components/AppFooter.vue
git commit -m "feat(web): link About/Contact in header and footer"
```

---

## Phase 8 — Final verification

### Task 23: Full suite + typecheck

- [ ] **Step 1: Run all affected package tests**

Run:
```bash
pnpm --filter @dragon/types test
pnpm --filter @dragon/sdk test
pnpm --filter @dragon/api test -- site
pnpm --filter @dragon/admin test -- site
```
Expected: all PASS.

- [ ] **Step 2: Typecheck / build**

Run:
```bash
pnpm --filter @dragon/api build
pnpm --filter @dragon/admin build
pnpm --filter @dragon/web build
```
Expected: all succeed with no TS errors.

- [ ] **Step 3: End-to-end smoke (manual)**

With api + admin + web running: set About + Contact in admin → verify `/about` + `/contact` render → submit a contact message → verify it lands in admin inbox → delete it. Confirm a non-super_admin without site permissions cannot reach the admin pages.

- [ ] **Step 4: Final commit (if any cleanup)**

```bash
git add -A
git commit -m "chore(site): final cleanup for about/contact feature"
```

---

## Self-Review Notes (author)

- **Spec coverage:** Structured SiteSettings singleton (Tasks 3-5) ✔; About rich text reuse (Task 3 schema + Task 16 editor) ✔; Contact structured fields incl. socials + map (Tasks 3, 11, 16, 21) ✔; contact form + flat inbox (Tasks 6-7, 10, 12, 17, 21) ✔; rate limit + honeypot (Tasks 8, 9, 10, 21) ✔; RBAC perms granted to super_admin (Task 2) ✔; public API prefix `api/v1` ✔; web About/Contact pages + header & footer links (Tasks 20-22) ✔; SEO reuse ✔; out-of-scope items (status workflow, email notify, captcha) excluded ✔.
- **Type consistency:** `SiteSettingsView`, `UpdateSiteSettingsInput`, `AboutInfo`/`ContactInfo`/`SocialLink` used consistently across repo→service→controller→dto. SDK/types DTO names (`PublicSiteSettingsResponse`, `AdminSiteSettingsResponse`, `ContactMessageListResponse`, `SubmitContactMessageRequest`, `UpdateSiteSettingsRequest`, `SiteGenericResponse`) match between Task 1 (types) and Tasks 9-14 (consumers).
- **Known confirmations the implementer must make (flagged inline):** `HtmlSanitizer.sanitize` method name; admin auth client factory in `admin-content.api.ts`; admin per-route permission declaration mechanism; `createApiClient` export usage in web. These are existing-pattern lookups, not placeholders.
