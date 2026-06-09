import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuditAction } from '@dragon/types';
import { Document, Model, Types } from 'mongoose';
import { AnalyticsEvent } from '../analytics/analytics-event.schema';
import { AuditLog } from '../audit/audit-log.schema';
import { NotificationLog } from '../auth/notifications/notification-log.schema';
import { hashPassword } from '../auth/security/password-hasher';
import { User } from '../auth/users/user.schema';
import { BackupLog } from '../backups/backup-log.schema';
import { Category } from '../content/categories/category.schema';
import { Page } from '../content/pages/page.schema';
import { Post } from '../content/posts/post.schema';
import { Tag } from '../content/tags/tag.schema';
import { Game } from '../games/game.schema';
import { JobLog } from '../jobs/job-log.schema';
import { MediaAsset } from '../media/media-asset.schema';
import { NotificationTemplate } from '../notifications/notification-template.schema';
import { UserProfile } from '../profiles/profile.schema';
import { PermissionRegistry } from '../rbac/registry/permission-registry';
import { RolePermissionRegistryMap } from '../rbac/registry/role-permission-registry';
import { RoleRegistry } from '../rbac/registry/role-registry';
import { Permission } from '../rbac/permissions/permission.schema';
import { RolePermission } from '../rbac/role-permissions/role-permission.schema';
import { Role } from '../rbac/roles/role.schema';
import { UserRole } from '../rbac/user-roles/user-role.schema';
import { TournamentMatch } from '../tournament-matches/tournament-match.schema';
import { TournamentRegistration } from '../tournament-registrations/tournament-registration.schema';
import { Tournament } from '../tournaments/tournament.schema';
import {
  DEFAULT_DEV_SEED_PASSWORD,
  DEV_SEED_CONTENT_CATEGORY_SLUGS,
  DEV_SEED_CONTENT_TAG_SLUGS,
  DEV_SEED_GAME_SLUGS,
  DEV_SEED_NOTIFICATION_TEMPLATE_KEYS,
  DEV_SEED_PAGE_SLUGS,
  DEV_SEED_POST_SLUGS,
  DEV_SEED_REQUEST_ID_PREFIX,
  DEV_SEED_TOURNAMENT_SLUGS,
  DEV_TEST_ACCOUNTS,
  PHASE1_DEV_SEED_BATCH,
  PHASE1_DEV_SEED_SOURCE,
} from './phase1-dev-seed.constants';
import { assertSafePhase1DevSeedTarget } from './seed-safety';

type SeedDocument = Document & { _id: Types.ObjectId; [key: string]: unknown };
type SeedModel = Model<SeedDocument>;

type AccountSeed = (typeof DEV_TEST_ACCOUNTS)[number];

type AccountSeedMap = Record<AccountSeed['email'], SeedDocument>;
type GameSeedMap = Record<(typeof DEV_SEED_GAME_SLUGS)[number], SeedDocument>;
type TournamentSeedMap = Record<(typeof DEV_SEED_TOURNAMENT_SLUGS)[number], SeedDocument>;

type SeedCounts = Record<string, number>;

interface ContentPostSeedInput {
  readonly type: 'news' | 'article' | 'guide' | 'announcement' | 'rule';
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string;
  readonly bodyHtml: string;
  readonly status: 'draft' | 'published';
  readonly publishedAt?: Date;
  readonly viewCount?: number;
  readonly featured?: boolean;
}

interface TournamentSeedInput {
  readonly slug: (typeof DEV_SEED_TOURNAMENT_SLUGS)[number];
  readonly title: string;
  readonly game: (typeof DEV_SEED_GAME_SLUGS)[number];
  readonly format: 'single_elimination' | 'round_robin' | 'manual';
  readonly status:
    | 'draft'
    | 'published'
    | 'registration_open'
    | 'registration_closed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'archived';
  readonly capacity: number;
  readonly registrationOpenAt: Date;
  readonly registrationCloseAt: Date;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly publishedAt?: Date;
  readonly cancelledAt?: Date;
  readonly archivedAt?: Date;
}

export interface Phase1DevSeedCredential {
  readonly purpose: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
  readonly roles: readonly string[];
  readonly status: string;
}

export interface Phase1DevSeedResult {
  readonly batch: string;
  readonly credentials: readonly Phase1DevSeedCredential[];
  readonly counts: SeedCounts;
  readonly coveredStates: {
    readonly users: readonly string[];
    readonly tournaments: readonly string[];
    readonly registrations: readonly string[];
    readonly matches: readonly string[];
    readonly notifications: readonly string[];
  };
}

export interface Phase1DevSeedResetResult {
  readonly usersDeleted: number;
  readonly profilesDeleted: number;
  readonly userRolesDeleted: number;
  readonly gamesDeleted: number;
  readonly tournamentsDeleted: number;
  readonly registrationsDeleted: number;
  readonly matchesDeleted: number;
  readonly notificationLogsDeleted: number;
  readonly notificationTemplatesDeleted: number;
  readonly auditLogsDeleted: number;
  readonly analyticsEventsDeleted: number;
  readonly postsDeleted: number;
  readonly pagesDeleted: number;
  readonly categoriesDeleted: number;
  readonly tagsDeleted: number;
  readonly mediaAssetsDeleted: number;
  readonly jobLogsDeleted: number;
  readonly backupLogsDeleted: number;
}

const NOW = new Date('2026-06-07T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

function plusDays(days: number): Date {
  return new Date(NOW.getTime() + days * DAY_MS);
}

function lower(value: string): string {
  return value.toLowerCase();
}

function requestId(suffix: string): string {
  return `${DEV_SEED_REQUEST_ID_PREFIX}${suffix}`;
}

function objectId(value: unknown): Types.ObjectId {
  if (value instanceof Types.ObjectId) return value;
  return new Types.ObjectId(String(value));
}

function idOf(doc: SeedDocument): string {
  return String(doc._id);
}

function asSeedModel<T>(model: Model<T>): SeedModel {
  return model as unknown as SeedModel;
}

@Injectable()
export class Phase1DevSeedService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(UserProfile.name) private readonly profileModel: Model<UserProfile>,
    @InjectModel(Permission.name) private readonly permissionModel: Model<Permission>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(RolePermission.name) private readonly rolePermissionModel: Model<RolePermission>,
    @InjectModel(UserRole.name) private readonly userRoleModel: Model<UserRole>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Tag.name) private readonly tagModel: Model<Tag>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(Page.name) private readonly pageModel: Model<Page>,
    @InjectModel(MediaAsset.name) private readonly mediaAssetModel: Model<MediaAsset>,
    @InjectModel(Game.name) private readonly gameModel: Model<Game>,
    @InjectModel(Tournament.name) private readonly tournamentModel: Model<Tournament>,
    @InjectModel(TournamentRegistration.name)
    private readonly registrationModel: Model<TournamentRegistration>,
    @InjectModel(TournamentMatch.name) private readonly matchModel: Model<TournamentMatch>,
    @InjectModel(NotificationLog.name) private readonly notificationLogModel: Model<NotificationLog>,
    @InjectModel(NotificationTemplate.name)
    private readonly notificationTemplateModel: Model<NotificationTemplate>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
    @InjectModel(AnalyticsEvent.name) private readonly analyticsEventModel: Model<AnalyticsEvent>,
    @InjectModel(JobLog.name) private readonly jobLogModel: Model<JobLog>,
    @InjectModel(BackupLog.name) private readonly backupLogModel: Model<BackupLog>,
  ) {}

  async runSeed(): Promise<Phase1DevSeedResult> {
    this.assertSeedSafety(false);

    const password = process.env.DRAGON_DEV_SEED_PASSWORD?.trim() || DEFAULT_DEV_SEED_PASSWORD;
    const passwordHash = await hashPassword(password);

    const roleMap = await this.seedSystemRbac();
    const accounts = await this.seedUsersAndProfiles(passwordHash);
    await this.seedUserRoles(accounts, roleMap);

    const content = await this.seedContent(accounts['editor@dragon.local']);
    const games = await this.seedGames();
    const tournaments = await this.seedTournaments(games);
    const registrations = await this.seedRegistrations(accounts, tournaments);
    await this.seedMatches(tournaments, registrations);
    await this.seedNotifications(accounts);
    await this.seedOperationalLogs(accounts, tournaments, content.mediaAsset);

    return {
      batch: PHASE1_DEV_SEED_BATCH,
      credentials: DEV_TEST_ACCOUNTS.map((account) => ({
        purpose: account.purpose,
        email: account.email,
        phone: account.phone,
        password,
        roles: account.roles,
        status: account.status,
      })),
      counts: await this.countSeededRecords(),
      coveredStates: {
        users: ['active', 'suspended'],
        tournaments: [
          'draft',
          'published',
          'registration_open',
          'registration_closed',
          'in_progress',
          'completed',
          'cancelled',
          'archived',
        ],
        registrations: ['submitted', 'approved', 'rejected', 'waitlisted', 'withdrawn', 'cancelled'],
        matches: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        notifications: [
          'registration submitted',
          'registration approved',
          'registration rejected',
          'tournament cancelled',
        ],
      },
    };
  }

  async resetSeed(): Promise<Phase1DevSeedResetResult> {
    this.assertSeedSafety(true);

    const userIds = await this.findSeedUserIds();
    const tournamentIds = await this.findSeedTournamentIds();

    const jobLogsDeleted = await this.deleteMany(this.jobLogModel, {
      bullJobId: { $regex: `^${DEV_SEED_REQUEST_ID_PREFIX}` },
    });
    const backupLogsDeleted = await this.deleteMany(this.backupLogModel, {
      fileKey: { $regex: `^${DEV_SEED_REQUEST_ID_PREFIX}` },
    });
    const analyticsEventsDeleted = await this.deleteMany(this.analyticsEventModel, {
      $or: [
        { anonymousId: { $regex: `^${DEV_SEED_REQUEST_ID_PREFIX}` } },
        { 'metadata.seedSource': PHASE1_DEV_SEED_SOURCE },
      ],
    });
    const auditLogsDeleted = await this.deleteMany(this.auditLogModel, {
      $or: [
        { requestId: { $regex: `^${DEV_SEED_REQUEST_ID_PREFIX}` } },
        { 'metadata.seedSource': PHASE1_DEV_SEED_SOURCE },
      ],
    });
    const notificationLogsDeleted = await this.deleteMany(this.notificationLogModel, {
      requestId: { $regex: `^${DEV_SEED_REQUEST_ID_PREFIX}` },
    });
    const notificationTemplatesDeleted = await this.deleteMany(this.notificationTemplateModel, {
      key: { $in: [...DEV_SEED_NOTIFICATION_TEMPLATE_KEYS] },
    });
    const matchesDeleted = await this.deleteMany(this.matchModel, {
      tournamentId: { $in: tournamentIds },
    });
    const registrationsDeleted = await this.deleteMany(this.registrationModel, {
      $or: [{ tournamentId: { $in: tournamentIds } }, { userId: { $in: userIds.map(String) } }],
    });
    const postsDeleted = await this.deleteMany(this.postModel, {
      slugNormalized: { $in: [...DEV_SEED_POST_SLUGS] },
    });
    const pagesDeleted = await this.deleteMany(this.pageModel, {
      slugNormalized: { $in: [...DEV_SEED_PAGE_SLUGS] },
    });
    const mediaAssetsDeleted = await this.deleteMany(this.mediaAssetModel, {
      checksum: { $regex: `^${DEV_SEED_REQUEST_ID_PREFIX}` },
    });
    const tournamentsDeleted = await this.deleteMany(this.tournamentModel, {
      slugNormalized: { $in: [...DEV_SEED_TOURNAMENT_SLUGS] },
    });
    const gamesDeleted = await this.deleteMany(this.gameModel, {
      slugNormalized: { $in: [...DEV_SEED_GAME_SLUGS] },
    });
    const profilesDeleted = await this.deleteMany(this.profileModel, {
      $or: [
        { userId: { $in: userIds } },
        { usernameNormalized: { $in: DEV_TEST_ACCOUNTS.map((account) => account.username) } },
      ],
    });
    const userRolesDeleted = await this.deleteMany(this.userRoleModel, {
      userId: { $in: userIds },
    });
    const usersDeleted = await this.deleteMany(this.userModel, {
      emailNormalized: { $in: DEV_TEST_ACCOUNTS.map((account) => account.email) },
      'metadata.registrationSource': PHASE1_DEV_SEED_SOURCE,
    });
    const categoriesDeleted = await this.deleteMany(this.categoryModel, {
      slugNormalized: { $in: [...DEV_SEED_CONTENT_CATEGORY_SLUGS] },
    });
    const tagsDeleted = await this.deleteMany(this.tagModel, {
      slugNormalized: { $in: [...DEV_SEED_CONTENT_TAG_SLUGS] },
    });

    return {
      usersDeleted,
      profilesDeleted,
      userRolesDeleted,
      gamesDeleted,
      tournamentsDeleted,
      registrationsDeleted,
      matchesDeleted,
      notificationLogsDeleted,
      notificationTemplatesDeleted,
      auditLogsDeleted,
      analyticsEventsDeleted,
      postsDeleted,
      pagesDeleted,
      categoriesDeleted,
      tagsDeleted,
      mediaAssetsDeleted,
      jobLogsDeleted,
      backupLogsDeleted,
    };
  }

  private assertSeedSafety(reset: boolean): void {
    assertSafePhase1DevSeedTarget({
      mongodbUri: process.env.MONGODB_URI,
      nodeEnv: process.env.NODE_ENV,
      appEnv: process.env.APP_ENV,
      allowReset: process.env.DRAGON_ALLOW_SEED_RESET,
      reset,
    });
  }

  private async seedSystemRbac(): Promise<Record<string, SeedDocument>> {
    const permissionMap: Record<string, SeedDocument> = {};
    const roleMap: Record<string, SeedDocument> = {};

    for (const permission of PermissionRegistry) {
      const doc = await this.upsert(this.permissionModel, { key: permission.key }, permission);
      permissionMap[permission.key] = doc;
    }

    for (const role of RoleRegistry) {
      const doc = await this.upsert(this.roleModel, { key: role.key }, role);
      roleMap[role.key] = doc;
    }

    for (const [roleKey, permissionKeys] of Object.entries(RolePermissionRegistryMap)) {
      const role = roleMap[roleKey];
      if (!role) continue;

      for (const permissionKey of permissionKeys) {
        const permission = permissionMap[permissionKey];
        if (!permission) continue;

        await this.upsert(
          this.rolePermissionModel,
          { roleId: role._id, permissionId: permission._id },
          { roleId: role._id, permissionId: permission._id },
        );
      }
    }

    return roleMap;
  }

  private async seedUsersAndProfiles(passwordHash: string): Promise<AccountSeedMap> {
    const output = {} as AccountSeedMap;

    for (const account of DEV_TEST_ACCOUNTS) {
      const phoneVerifiedAt = account.status === 'active' ? plusDays(-20) : undefined;
      const userSet: Record<string, unknown> = {
        phone: account.phone,
        phoneNormalized: account.phone,
        email: account.email,
        emailNormalized: lower(account.email),
        passwordHash,
        status: account.status,
        statusReason:
          account.status === 'suspended' ? 'local seed suspended user for access testing' : undefined,
        failedLoginCount: 0,
        metadata: {
          registrationSource: PHASE1_DEV_SEED_SOURCE,
          locale: 'en-US',
        },
      };

      if (phoneVerifiedAt !== undefined) userSet.phoneVerifiedAt = phoneVerifiedAt;
      if (account.status === 'active') userSet.emailVerifiedAt = plusDays(-20);

      const user = await this.upsert(
        this.userModel,
        { emailNormalized: lower(account.email) },
        userSet,
      );
      output[account.email] = user;

      await this.upsert(
        this.profileModel,
        { userId: user._id },
        {
          userId: user._id,
          username: account.username,
          usernameNormalized: account.username,
          displayName: account.displayName,
          bio: `${account.purpose} profile generated by ${PHASE1_DEV_SEED_BATCH}.`,
          visibility: account.status === 'suspended' ? 'private' : 'public',
          publicUrl: `/u/${account.username}`,
        },
      );
    }

    return output;
  }

  private async seedUserRoles(
    accounts: AccountSeedMap,
    roleMap: Record<string, SeedDocument>,
  ): Promise<void> {
    for (const account of DEV_TEST_ACCOUNTS) {
      const user = accounts[account.email];
      for (const roleKey of account.roles) {
        const role = roleMap[roleKey];
        if (!role) continue;
        await this.upsert(
          this.userRoleModel,
          { userId: user._id, roleId: role._id, scopeType: { $exists: false }, scopeId: { $exists: false } },
          {
            userId: user._id,
            roleId: role._id,
            assignedAt: plusDays(-14),
          },
        );
      }
    }
  }

  private async seedContent(editor: SeedDocument): Promise<{ readonly mediaAsset: SeedDocument }> {
    // ── Categories ──────────────────────────────────────────────────────────
    const allCategories: SeedDocument[] = [];
    for (const category of [
      { slug: 'phase1-esports', name: 'Phase 1 Esports', sortOrder: 10 },
      { slug: 'phase1-tournaments', name: 'Phase 1 Tournaments', sortOrder: 20 },
      { slug: 'phase1-guides', name: 'Phase 1 Guides', sortOrder: 30 },
      { slug: 'esports-news-fa', name: 'اخبار اسپورت', sortOrder: 1 },
      { slug: 'analysis-fa', name: 'تحلیل و بررسی', sortOrder: 2 },
      { slug: 'player-guides-fa', name: 'راهنمای بازیکن', sortOrder: 3 },
      { slug: 'official-fa', name: 'اطلاعیه‌های رسمی', sortOrder: 4 },
    ]) {
      allCategories.push(
        await this.upsert(
          this.categoryModel,
          { slugNormalized: category.slug },
          {
            name: category.name,
            slug: category.slug,
            slugNormalized: category.slug,
            description: `دسته‌بندی ${category.name}`,
            sortOrder: category.sortOrder,
          },
        ),
      );
    }

    const catBySlug = (slug: string) => allCategories.find((c) => String(c.get?.('slugNormalized') ?? c['slugNormalized']) === slug)!;

    // ── Tags ────────────────────────────────────────────────────────────────
    const allTags: SeedDocument[] = [];
    for (const tag of [
      { slug: 'phase1-featured', name: 'Phase 1 Featured' },
      { slug: 'phase1-local-test', name: 'Phase 1 Local Test' },
      { slug: 'phase1-bracket', name: 'Phase 1 Bracket' },
      { slug: 'featured', name: 'ویژه' },
      { slug: 'valorant-fa', name: 'والوریس' },
      { slug: 'dota2-fa', name: 'دوتا ۲' },
      { slug: 'cs2-fa', name: 'CS2' },
      { slug: 'tournament-fa', name: 'تورنامنت' },
    ]) {
      allTags.push(
        await this.upsert(this.tagModel, { slugNormalized: tag.slug }, {
          name: tag.name,
          slug: tag.slug,
          slugNormalized: tag.slug,
        }),
      );
    }

    const tagBySlug = (slug: string) => allTags.find((t) => String(t.get?.('slugNormalized') ?? t['slugNormalized']) === slug)!;

    // ── Media asset (placeholder) ────────────────────────────────────────────
    const mediaAsset = await this.upsert(
      this.mediaAssetModel,
      { checksum: `${DEV_SEED_REQUEST_ID_PREFIX}media-cover-1` },
      {
        originalName: 'phase1-local-cover.jpg',
        fileName: 'phase1-local-cover.jpg',
        mimeType: 'image/jpeg',
        extension: 'jpg',
        sizeBytes: 128000,
        storageProvider: 'local',
        bucket: 'dragon-local',
        objectKey: `${DEV_SEED_REQUEST_ID_PREFIX}media/phase1-local-cover.jpg`,
        visibility: 'public',
        variants: [
          {
            type: 'thumbnail',
            objectKey: `${DEV_SEED_REQUEST_ID_PREFIX}media/phase1-local-cover-thumb.jpg`,
            width: 320,
            height: 180,
            sizeBytes: 16000,
            mimeType: 'image/jpeg',
          },
        ],
        width: 1280,
        height: 720,
        alt: 'تصویر کاور اسپورت',
        caption: 'تصویر کاور نمونه برای محیط توسعه.',
        uploadedBy: editor._id,
        status: 'ready',
        checksum: `${DEV_SEED_REQUEST_ID_PREFIX}media-cover-1`,
      },
    );

    // ── Posts ────────────────────────────────────────────────────────────────
    const featuredTag = tagBySlug('featured');
    const tournamentTag = tagBySlug('tournament-fa');
    const valorantTag = tagBySlug('valorant-fa');
    const dota2Tag = tagBySlug('dota2-fa');
    const cs2Tag = tagBySlug('cs2-fa');
    const newsCategory = catBySlug('esports-news-fa');
    const analysisCategory = catBySlug('analysis-fa');
    const guidesCategory = catBySlug('player-guides-fa');
    const officialCategory = catBySlug('official-fa');

    const postInputs: readonly ContentPostSeedInput[] = [
      // ── Legacy phase1 posts (backward-compat) ──
      {
        type: 'news',
        title: 'Valorant Open Registration Is Live',
        slug: 'phase1-local-valorant-open',
        excerpt: 'ثبت‌نام مسابقات والوریس آغاز شد. همین حالا ثبت‌نام کنید.',
        bodyHtml: '<p>ثبت‌نام مسابقات والوریس رسماً آغاز شده است. برای شرکت در این رویداد به بخش تورنامنت‌ها مراجعه کنید.</p>',
        status: 'published',
        publishedAt: plusDays(-3),
        viewCount: 240,
      },
      {
        type: 'guide',
        title: 'How Phase 1 Brackets Work Locally',
        slug: 'phase1-local-bracket-guide',
        excerpt: 'راهنمای سیستم براکت در مسابقات فاز اول.',
        bodyHtml: '<p>سیستم براکت در مسابقات به این شکل عمل می‌کند: تیم‌ها در دو گروه قرار می‌گیرند و برترین‌ها به مرحله بعد راه می‌یابند.</p>',
        status: 'published',
        publishedAt: plusDays(-2),
        viewCount: 180,
      },
      {
        type: 'announcement',
        title: 'Admin Operations Test Announcement',
        slug: 'phase1-local-admin-announcement',
        excerpt: 'اطلاعیه آزمایشی سیستم.',
        bodyHtml: '<p>این یک اطلاعیه آزمایشی برای تست سیستم مدیریت محتوا است.</p>',
        status: 'draft',
        viewCount: 0,
      },

      // ── Featured posts (tagged 'featured' → show as hero + featured cards) ──
      {
        type: 'news',
        slug: 'fa-valorant-season2-launch',
        title: 'فصل دوم مسابقات والوریس آغاز شد',
        excerpt: 'دراگون اسپورت با افتخار اعلام می‌کند که دومین فصل مسابقات والوریس با مشارکت بیش از ۶۴ تیم از سراسر کشور رسماً آغاز شد.',
        bodyHtml: `<p>دراگون اسپورت با افتخار اعلام می‌کند که دومین فصل از رقابت‌های رسمی والوریس در ایران رسماً آغاز شد. این دوره با مشارکت بیش از ۶۴ تیم از سراسر کشور برگزار می‌شود و پایه‌گذار رقابت‌های ملی در این ژانر خواهد بود.</p>
<h2>ساختار مسابقات</h2>
<p>مسابقات در سه مرحله اصلی برگزار می‌شود: مرحله گروهی، نیمه‌نهایی و فینال بزرگ. هر تیم از پنج بازیکن اصلی و دو بازیکن جایگزین تشکیل شده است. برخلاف فصل اول، این بار تیم‌های با سطح مهارت مشابه در یک گروه قرار می‌گیرند.</p>
<ul>
  <li>مرحله گروهی: ۸ گروه، هر گروه ۸ تیم</li>
  <li>نیمه‌نهایی: ۳۲ تیم برتر</li>
  <li>فینال: ۸ تیم برگزیده</li>
</ul>
<h2>نحوه ثبت‌نام</h2>
<p>ثبت‌نام از طریق پنل کاربری دراگون اسپورت انجام می‌شود. کاپیتان تیم باید مشخصات تمام اعضا را وارد کند. مهلت ثبت‌نام تا پایان هفته جاری ادامه دارد و تیم‌هایی که پیش‌تر در فصل اول شرکت کرده‌اند از اولویت ثبت‌نام برخوردارند.</p>
<h2>قوانین اصلی</h2>
<p>هر بازیکن مجاز به عضویت در تنها یک تیم است. استفاده از هرگونه نرم‌افزار کمکی (Cheat/Hack) منجر به محرومیت دائمی خواهد شد. تمام بازی‌ها در سرورهای رسمی و با نظارت مستقیم برگزار می‌شوند.</p>`,
        status: 'published',
        publishedAt: plusDays(-1),
        viewCount: 4800,
        featured: true,
      },
      {
        type: 'article',
        slug: 'fa-esports-growth-analysis',
        title: 'اسپورت ایران؛ از جوانه تا درخت',
        excerpt: 'نگاهی به رشد چشمگیر اسپورت در ایران طی دو سال گذشته و نقش پلتفرم‌های بومی در شکل‌دادن به آینده این صنعت نوپا.',
        bodyHtml: `<p>صنعت اسپورت ایران در دو سال اخیر با رشدی بی‌سابقه مواجه شده است. از مسابقات خانگی کوچک با تعداد محدود شرکت‌کننده تا رویدادهای ملی با هزاران تماشاگر — این مسیر پر از تحول بوده است.</p>
<h2>آمار و ارقام</h2>
<p>طبق آخرین آمار منتشرشده، تعداد بازیکنان حرفه‌ای اسپورت در ایران در سال ۱۴۰۳ به بیش از ۱۲۰ هزار نفر رسید. این رقم نسبت به سال ۱۴۰۱ بیش از سه برابر شده است. درآمد کل صنعت اسپورت ایران نیز در همین دوره رشدی بیش از ۲۸۰٪ داشت.</p>
<h3>بازی‌های محبوب در ایران</h3>
<ul>
  <li>والوریس — ۴۲٪ از کل مسابقات</li>
  <li>دوتا ۲ — ۲۸٪ از کل مسابقات</li>
  <li>CS2 — ۱۸٪ از کل مسابقات</li>
  <li>سایر بازی‌ها — ۱۲٪</li>
</ul>
<h2>نقش پلتفرم‌های بومی</h2>
<p>ظهور پلتفرم‌هایی مثل دراگون اسپورت که زیرساخت کامل برگزاری مسابقات را فراهم می‌کنند، نقش کلیدی در رشد این صنعت داشته است. امکاناتی مثل ثبت‌نام آنلاین، مدیریت براکت، نتایج زنده و سیستم رتبه‌بندی، پیش‌تر تنها در اختیار تیم‌های بین‌المللی بود.</p>
<h2>چالش‌های پیش رو</h2>
<p>علی‌رغم رشد چشمگیر، چالش‌هایی مثل کمبود اسپانسرهای بزرگ، نبود مجوزهای رسمی برای برخی بازی‌ها و کمبود بازیکنان حرفه‌ای زن هنوز باقی هستند. با این حال روند فعلی نشان می‌دهد که اسپورت ایران در مسیر درستی قرار دارد.</p>`,
        status: 'published',
        publishedAt: plusDays(-4),
        viewCount: 3200,
        featured: true,
      },
      {
        type: 'guide',
        slug: 'fa-tournament-registration-guide',
        title: 'راهنمای جامع ثبت‌نام در تورنامنت‌های دراگون',
        excerpt: 'هر آنچه که باید درباره نحوه ثبت‌نام، تشکیل تیم و آمادگی برای مسابقات در پلتفرم دراگون اسپورت بدانید.',
        bodyHtml: `<p>ثبت‌نام در مسابقات دراگون اسپورت یک فرایند ساده و کاملاً آنلاین است. این راهنما شما را قدم به قدم از ابتدا تا پایان همراهی می‌کند.</p>
<h2>گام اول: ایجاد حساب کاربری</h2>
<p>برای شرکت در هر تورنامنتی ابتدا باید یک حساب کاربری فعال داشته باشید. فرایند ثبت‌نام با شماره موبایل و ایمیل انجام می‌شود. تأیید هویت الزامی است تا از سلامت رقابت‌ها اطمینان حاصل شود.</p>
<h2>گام دوم: تکمیل پروفایل</h2>
<p>پیش از ثبت‌نام در مسابقه، پروفایل خود را کامل کنید. این شامل نام مستعار (Gamer Tag)، اطلاعات تماس و مشخصات حساب بازی است. پروفایل کامل‌تر به مدیران تورنامنت کمک می‌کند تا اطلاعات دقیق‌تری داشته باشند.</p>
<h2>گام سوم: انتخاب تورنامنت</h2>
<p>از بخش تورنامنت‌ها، مسابقه مورد نظر خود را انتخاب کنید. توجه کنید به:</p>
<ul>
  <li>تاریخ شروع و پایان ثبت‌نام</li>
  <li>ظرفیت باقی‌مانده</li>
  <li>فرمت مسابقه (حذفی، دوره‌ای)</li>
  <li>قوانین و شرایط شرکت</li>
</ul>
<h2>گام چهارم: تشکیل تیم (در صورت نیاز)</h2>
<p>برای بازی‌های تیمی مثل والوریس و CS2، باید تیم خود را تشکیل دهید. کاپیتان تیم مسئول ثبت‌نام است و باید شناسه بازی تمام اعضا را از قبل آماده کند.</p>
<h2>مشکلات رایج و راه‌حل</h2>
<p>اگر در فرایند ثبت‌نام با مشکل مواجه شدید، تیم پشتیبانی دراگون در تمام ساعات روز آماده کمک است. از طریق بخش چت آنلاین یا ایمیل support@dragon.ir با ما در ارتباط باشید.</p>`,
        status: 'published',
        publishedAt: plusDays(-5),
        viewCount: 2900,
        featured: true,
      },
      {
        type: 'announcement',
        slug: 'fa-season-1404-announcement',
        title: 'اطلاعیه: آغاز فصل رقابتی ۱۴۰۴',
        excerpt: 'دراگون اسپورت با مفتخر اعلام می‌کند که فصل رقابتی ۱۴۰۴ با ۱۰ تورنامنت رسمی در ۶ عنوان بازی رسماً آغاز می‌شود.',
        bodyHtml: `<p>دراگون اسپورت با افتخار اعلام می‌کند که فصل رقابتی ۱۴۰۴ با ۱۰ تورنامنت رسمی در ۶ عنوان بازی آغاز می‌شود. این فصل بزرگترین رویداد اسپورتی در تاریخ پلتفرم دراگون خواهد بود.</p>
<h2>تورنامنت‌های برنامه‌ریزی شده</h2>
<ul>
  <li>لیگ والوریس ایران — فصل دوم</li>
  <li>جام CS2 دراگون — نسخه جدید</li>
  <li>مسابقات دوتا ۲ — دوره‌ای</li>
  <li>جام EA FC ۱۴۰۴</li>
  <li>لیگ لیگ آف لجندز</li>
  <li>جام موبایل لجندز</li>
</ul>
<h2>نکات مهم</h2>
<p>ثبت‌نام تمام تورنامنت‌ها از ابتدای فروردین ۱۴۰۴ آغاز می‌شود. بازیکنانی که در فصل ۱۴۰۳ شرکت داشته‌اند از تخفیف ۲۰٪ در هزینه ثبت‌نام برخوردار خواهند بود.</p>
<p>برای اطلاعات بیشتر و ثبت نام در لیست انتظار، ایمیل خود را در بخش «اعلان‌های فصل جدید» ثبت کنید.</p>`,
        status: 'published',
        publishedAt: plusDays(-7),
        viewCount: 5400,
        featured: true,
      },
      {
        type: 'news',
        slug: 'fa-dragon-platform-launch',
        title: 'دراگون اسپورت: نسخه ۲.۰ رسماً منتشر شد',
        excerpt: 'با انتشار نسخه ۲.۰ پلتفرم دراگون اسپورت، امکانات جدیدی از جمله پخش زنده، سیستم رتبه‌بندی و پروفایل عمومی بازیکنان اضافه شدند.',
        bodyHtml: `<p>دراگون اسپورت با انتشار نسخه ۲.۰ خود یک قدم بزرگ در راستای تبدیل شدن به جامع‌ترین پلتفرم اسپورت ایران برداشت. این نسخه پس از ۶ ماه توسعه و آزمایش بتا، امروز برای عموم کاربران در دسترس قرار گرفت.</p>
<h2>قابلیت‌های جدید</h2>
<h3>پخش زنده تورنامنت‌ها</h3>
<p>از این پس می‌توانید تمام مسابقات رسمی دراگون را به صورت زنده از داخل پلتفرم تماشا کنید. این قابلیت با تأخیر کمتر از ۵ ثانیه و کیفیت ۱۰۸۰p ارائه می‌شود.</p>
<h3>سیستم رتبه‌بندی جدید</h3>
<p>رتبه‌بندی بازیکنان از این پس بر اساس الگوریتم ELO محاسبه می‌شود. رتبه شما بر اساس نتیجه هر مسابقه به صورت لحظه‌ای بروزرسانی می‌شود.</p>
<h3>پروفایل عمومی بازیکن</h3>
<p>هر بازیکن می‌تواند یک پروفایل عمومی داشته باشد که آمار کامل مسابقات، تیم‌های قبلی و افتخارات را نمایش می‌دهد.</p>
<h2>چه تغییراتی ایجاد شده؟</h2>
<p>رابط کاربری کاملاً بازطراحی شده، سرعت بارگذاری صفحات ۳ برابر بهتر شده و سیستم اعلان‌رسانی به شکل چشمگیری بهبود یافته است. همچنین پشتیبانی از حالت تاریک (Dark Mode) به پلتفرم اضافه شده است.</p>`,
        status: 'published',
        publishedAt: plusDays(-6),
        viewCount: 3800,
        featured: true,
      },

      // ── Regular news ──
      {
        type: 'news',
        slug: 'fa-cs2-update-news',
        title: 'آپدیت جدید CS2 با تغییرات بزرگ نقشه‌ها',
        excerpt: 'والو با انتشار آپدیت ۱.۳۸ تغییرات گسترده‌ای در نقشه‌های Dust2 و Mirage اعمال کرد که توازن بازی را تحت‌تأثیر قرار می‌دهد.',
        bodyHtml: `<p>شرکت والو با انتشار آپدیت ۱.۳۸ بازی CS2، تغییرات قابل توجهی در نقشه‌های محبوب این بازی اعمال کرد. این تغییرات بر اساس بازخوردهای جامعه حرفه‌ای بازیکنان صورت گرفته است.</p>
<h2>تغییرات Dust2</h2>
<p>محوطه A Site کوچک‌تر شده و چندین دیواره اضافه شده‌اند که زاویه‌های دید را تغییر می‌دهند. این تغییرات نقش آتشبار را قوی‌تر کرده است.</p>
<h2>تغییرات Mirage</h2>
<p>بخش Mid این نقشه کاملاً بازطراحی شده و کنترل آن برای هر دو طرف دشوارتر شده است. این تغییر احتمالاً متای فعلی را به هم خواهد ریخت.</p>
<h2>نظر کارشناسان</h2>
<p>بسیاری از بازیکنان حرفه‌ای ایرانی معتقدند این تغییرات مثبت است و بازی‌های تیمی را جذاب‌تر خواهد کرد. تیم‌های شرکت‌کننده در مسابقات دراگون باید استراتژی‌های خود را بازبینی کنند.</p>`,
        status: 'published',
        publishedAt: plusDays(-2),
        viewCount: 720,
      },
      {
        type: 'news',
        slug: 'fa-dota2-patch-notes',
        title: 'پچ ۷.۳۷ دوتا ۲: قهرمانان جدید و تغییرات متا',
        excerpt: 'آخرین پچ دوتا ۲ با بافت ۱۵ قهرمان، نرف ۸ قهرمان قوی و معرفی یک آیتم جدید منتشر شد.',
        bodyHtml: `<p>آیس‌فراگ آخرین پچ بزرگ دوتا ۲ را منتشر کرد. پچ ۷.۳۷ با تغییرات گسترده در بالانس قهرمانان و آیتم‌ها همراه است و احتمالاً متای فعلی بازی را به کل تغییر خواهد داد.</p>
<h2>قهرمانان بافت شده</h2>
<p>میرانا، لانا، اوگر میجی، اینوکر، ونگفو، آنتی-میجی، پاک، اج‌هاگ، فانتم اسپکتر، وینجر، لیچ، دروپ، تیدهانتر، دزل و اندز بافت شدند.</p>
<h2>قهرمانان نرف شده</h2>
<p>دراگون نایت، مارثی، آمبیون، گانگریل، نوتنگ کینگ، تیمبرسو، سایلنسر و سیون نرف دریافت کردند.</p>
<h2>تأثیر بر مسابقات دراگون</h2>
<p>تیم‌های شرکت‌کننده در لیگ دوتا ۲ دراگون باید با توجه به این تغییرات، دکس‌های خود را بازبینی کنند. تیم مدیریت مسابقات دراگون اعلام کرده که مسابقات هفته آینده با همین ورژن برگزار خواهد شد.</p>`,
        status: 'published',
        publishedAt: plusDays(-3),
        viewCount: 650,
      },
      {
        type: 'news',
        slug: 'fa-mobile-cup-recap',
        title: 'گزارش جام موبایل لجندز: تیم فینیکس قهرمان شد',
        excerpt: 'تیم فینیکس در یک فینال هیجان‌انگیز ۳ به ۲ توانست تیم نووا را شکست دهد و عنوان قهرمانی را از آن خود کند.',
        bodyHtml: `<p>فینال جام موبایل لجندز دراگون دیشب با حضور بیش از ۵۰۰ تماشاگر آنلاین برگزار شد. در یک رویارویی هیجان‌انگیز، تیم فینیکس با نتیجه ۳ بر ۲ بازی تیم نووا را شکست داد و برای اولین بار به قهرمانی رسید.</p>
<h2>خلاصه فینال</h2>
<p>ست اول و دوم به راحتی به نفع نووا تمام شد. اما فینیکس از ست سوم بازی کاملاً متفاوتی ارائه داد. ست‌های چهارم و پنجم از هیجانی‌ترین بازی‌های این مسابقات بود.</p>
<h2>MVP مسابقات</h2>
<p>رها فینیکس (Raha Phoenix)، هدر تیم فینیکس، به عنوان MVP کل تورنامنت انتخاب شد. وی در تمام بازی‌های این مسابقات عملکرد درخشانی داشت.</p>
<h2>جوایز</h2>
<p>تیم قهرمان ۳۰ میلیون تومان و تیم نائب قهرمان ۱۵ میلیون تومان دریافت کردند. تمام ۸ تیم شرکت‌کننده در مرحله فینال، مدال و جایزه دریافت کردند.</p>`,
        status: 'published',
        publishedAt: plusDays(-8),
        viewCount: 430,
      },
      {
        type: 'news',
        slug: 'fa-lol-new-season',
        title: 'لیگ آف لجندز: فصل جدید با قوانین تازه',
        excerpt: 'رایوت گیمز تغییرات اساسی در فصل ۲۰۲۵ بازی لیگ آف لجندز معرفی کرد که شامل سیستم رتبه‌بندی جدید و نقشه بازطراحی‌شده است.',
        bodyHtml: `<p>رایوت گیمز در یک رویداد آنلاین، تمام تغییرات فصل ۲۰۲۵ بازی لیگ آف لجندز را معرفی کرد. این تغییرات از نظر دامنه و وسعت بزرگترین اصلاحات در تاریخ این بازی هستند.</p>
<h2>سیستم رتبه‌بندی جدید</h2>
<p>سیستم لیگ قدیمی جای خود را به یک سیستم پله‌ای جدید می‌دهد. از این پس ترقی رتبه راحت‌تر اما سقوط رتبه سریع‌تر اتفاق می‌افتد. رتبه‌های Iron و Bronze با هم ادغام شدند.</p>
<h2>تغییرات نقشه</h2>
<p>جنگل کاملاً بازطراحی شده است. ۳ کمپ جدید اضافه و ۲ کمپ قدیمی حذف شدند. این تغییرات نقش جنگلبان را اساسی‌تر از قبل می‌کند.</p>
<h2>قهرمانان جدید</h2>
<p>در فصل ۲۰۲۵، رایوت قرار است ۶ قهرمان جدید معرفی کند. اولین قهرمان ژانویه معرفی می‌شود و یک پشتیبان با مکانیزم کاملاً جدید خواهد بود.</p>`,
        status: 'published',
        publishedAt: plusDays(-9),
        viewCount: 380,
      },
      {
        type: 'news',
        slug: 'fa-eafc-cup-news',
        title: 'جام EA FC دراگون: ثبت‌نام آغاز شد',
        excerpt: 'پانزدهمین دوره جام EA FC دراگون با ظرفیت ۳۲ نفر و جایزه نقدی ۱۰ میلیون تومانی برگزار می‌شود.',
        bodyHtml: `<p>دراگون اسپورت ثبت‌نام پانزدهمین دوره جام EA FC را آغاز کرد. این دوره با ظرفیت ۳۲ شرکت‌کننده و فرمت حذفی دوگانه برگزار می‌شود.</p>
<h2>فرمت مسابقه</h2>
<p>مسابقات در قالب حذفی دوگانه (Double Elimination) برگزار می‌شود. این یعنی حتی پس از یک شکست، هنوز شانس قهرمانی دارید. فینال به صورت بهترین از ۵ بازی برگزار خواهد شد.</p>
<h2>جوایز</h2>
<ul>
  <li>اول: ۵ میلیون تومان</li>
  <li>دوم: ۳ میلیون تومان</li>
  <li>سوم: ۲ میلیون تومان</li>
</ul>
<h2>شرایط شرکت</h2>
<p>شرکت‌کنندگان باید نسخه EA FC 25 را داشته باشند. اتصال اینترنت پایدار الزامی است. بازی‌ها روی پلتفرم PC برگزار می‌شوند.</p>`,
        status: 'published',
        publishedAt: plusDays(-10),
        viewCount: 290,
      },

      // ── Articles ──
      {
        type: 'article',
        slug: 'fa-meta-analysis-valorant',
        title: 'تحلیل متا والوریس در اپیزود ۸: کدام عوامل مسلط هستند؟',
        excerpt: 'با ورود به اپیزود ۸، متای والوریس تغییرات اساسی پیدا کرده. در این مقاله به بررسی عوامل برتر، استراتژی‌های مرسوم و پیش‌بینی تغییرات آینده می‌پردازیم.',
        bodyHtml: `<p>اپیزود ۸ والوریس با تغییرات قابل توجهی در متا همراه بوده است. تیم‌های حرفه‌ای در سراسر جهان استراتژی‌های خود را بازنویسی کرده‌اند. در این تحلیل، وضعیت فعلی متا در ایران را بررسی می‌کنیم.</p>
<h2>عوامل برتر در اپیزود ۸</h2>
<h3>کنترلرها</h3>
<p>ووایپر و آسترا در حال حاضر قوی‌ترین کنترلرها هستند. توانایی ووایپر در کنترل خطوط دید و آسترا در مدیریت کل نقشه، آنها را در تقریباً هر ترکیب تیمی جای می‌دهد.</p>
<h3>دوئلیست‌ها</h3>
<p>رِز و یورو در این اپیزود رشد قابل توجهی داشتند. رِز با بافت‌های اخیر قوی‌تر شده در حالی که یورو به دلیل موبیلیتی بالایش همچنان در پیک بازی حرفه‌ای است.</p>
<h3>اینیشیتورها</h3>
<p>فید، کای/او و اسکای سه‌گانه اینیشیتورهای این فصل هستند. توانایی ایجاد فرصت‌های درگیری و پشتیبانی از هم‌تیمی‌ها آنها را ضروری می‌کند.</p>
<h2>استراتژی‌های رایج</h2>
<p>رایج‌ترین استراتژی تیمی در حال حاضر «فست-اکسکیوت» است: گیرانده‌ها سریع سایت را می‌گیرند و کنترلرها دفاع رقیب را ناکارآمد می‌کنند. این استراتژی به ترکیب دقیق ووایپر + رِز + فید نیاز دارد.</p>
<h2>پیش‌بینی متا آینده</h2>
<p>با توجه به بافت‌های برنامه‌ریزی شده برای پچ بعدی، احتمالاً جمع-آپ‌ها ضعیف‌تر و اینیشیتورها قوی‌تر خواهند شد. تیم‌هایی که از هم‌اکنون روی اینیشیتورها تمرکز کنند مزیت رقابتی بهتری خواهند داشت.</p>`,
        status: 'published',
        publishedAt: plusDays(-11),
        viewCount: 1800,
      },
      {
        type: 'article',
        slug: 'fa-team-strategy-guide',
        title: 'استراتژی تیمی در دوتا ۲: از درافت تا اجرا',
        excerpt: 'یک تیم موفق در دوتا ۲ چطور دکس می‌کند؟ چه اصولی پایه هر دکس قوی هستند و چگونه می‌توان استراتژی رقیب را خنثی کرد؟',
        bodyHtml: `<p>دوتا ۲ یکی از پیچیده‌ترین بازی‌های اسپورت است که در آن دکس (انتخاب قهرمانان) نیمی از پیروزی را تعیین می‌کند. در این مقاله اصول پایه‌ای استراتژی تیمی را بررسی می‌کنیم.</p>
<h2>ستون‌های یک دکس قوی</h2>
<h3>۱. هدف مشخص</h3>
<p>هر دکس باید یک هدف اصلی داشته باشد: فارم محور، تهاجمی زودهنگام، پشتیبانی قوی یا کنترل نقشه. بدون هدف مشخص، قهرمانان ارتباطی با هم نخواهند داشت.</p>
<h3>۲. پوشش ضعف‌ها</h3>
<p>هر قهرمانی ضعف دارد. دکس خوب اطمینان می‌دهد که ضعف‌های هر قهرمان توسط هم‌تیمی‌ها پوشش داده می‌شود.</p>
<h3>۳. سینرژی</h3>
<p>قهرمانانی که با هم کار می‌کنند قوی‌تر از مجموع آن‌ها هستند. برخی ترکیب‌ها مثل Tidehunter + Magnus یا Invoker + Earthshaker می‌توانند یک بازی را در یک لحظه تغییر دهند.</p>
<h2>فازهای بازی و اجرای استراتژی</h2>
<p>یک استراتژی خوب برای هر فاز بازی برنامه دارد: Early Game، Mid Game و Late Game. تیمی که در هر سه فاز برنامه داشته باشد شانس بیشتری برای پیروزی خواهد داشت.</p>
<h2>مقابله با استراتژی رقیب</h2>
<p>درک استراتژی رقیب و خنثی‌سازی آن مهمترین مهارت کوچ‌های حرفه‌ای است. در مسابقات دراگون، تیم‌هایی که توانایی «کانتر-پیک» را دارند معمولاً عملکرد بهتری نشان می‌دهند.</p>`,
        status: 'published',
        publishedAt: plusDays(-13),
        viewCount: 1200,
      },

      // ── Guides ──
      {
        type: 'guide',
        slug: 'fa-valorant-beginner-guide',
        title: 'مبانی والوریس برای تازه‌کاران ایرانی',
        excerpt: 'اگر تازه شروع به بازی والوریس کرده‌اید، این راهنما تمام آنچه برای شروع حرفه‌ای نیاز دارید را پوشش می‌دهد.',
        bodyHtml: `<p>والوریس یک بازی تاکتیکال شوتر ۵ در مقابل ۵ است که در آن دو تیم، یکی به عنوان آتاکر و دیگری به عنوان دیفندر با هم رویارو می‌شوند. هدف آتاکرها نصب اسپایک و هدف دیفندرها جلوگیری از این کار است.</p>
<h2>مفاهیم پایه</h2>
<h3>عوامل (Agents)</h3>
<p>در والوریس شما یک عامل انتخاب می‌کنید. هر عامل ۴ اسکیل منحصربه‌فرد دارد. برای شروع، رِیز یا رِینا بهترین گزینه‌ها هستند چون مستقیم‌ترین مکانیک‌ها را دارند.</p>
<h3>اکونومی</h3>
<p>مدیریت پول در والوریس حیاتی است. نه هر راند می‌توانید بهترین تجهیزات را بخرید. یاد بگیرید چه زمانی «ایکو» کنید و چه زمانی «فول‌بای» کنید.</p>
<h3>ارتباط تیمی</h3>
<p>والوریس یک بازی تیمی است. استفاده از میکروفن و اطلاع‌رسانی درباره موقعیت دشمنان از ضروری‌ترین مهارت‌ها است.</p>
<h2>اولین قدم‌ها برای پیشرفت</h2>
<ul>
  <li>ابتدا در حالت آنریتد بازی کنید</li>
  <li>روی یک یا دو عامل تمرکز کنید</li>
  <li>Crosshair Placement خود را بهبود دهید</li>
  <li>نقشه‌های اصلی را کاملاً بیاموزید</li>
  <li>از بخش تمرین Range استفاده کنید</li>
</ul>
<h2>اشتباهات رایج تازه‌کاران</h2>
<p>دویدن در حین شلیک، پیک کردن بدون اطلاعات از موقعیت دشمن، و خرید اسپایک بدون همکاری تیمی از رایج‌ترین اشتباهات مبتدیان است. با اصلاح این موارد سریعاً رتبه‌تان بالا خواهد رفت.</p>`,
        status: 'published',
        publishedAt: plusDays(-14),
        viewCount: 2400,
      },
      {
        type: 'guide',
        slug: 'fa-bracket-system-guide',
        title: 'سیستم براکت مسابقات: راهنمای کامل',
        excerpt: 'در مسابقات دراگون از سه نوع فرمت استفاده می‌شود. در این راهنما توضیح می‌دهیم هر فرمت چگونه کار می‌کند و کدام برای چه موقعیتی مناسب‌تر است.',
        bodyHtml: `<p>فرمت مسابقات تعیین می‌کند که چگونه برندگان و بازندگان مشخص می‌شوند. در پلتفرم دراگون اسپورت سه نوع فرمت اصلی وجود دارد که هر کدام ویژگی‌های خاص خود را دارند.</p>
<h2>۱. حذفی تکی (Single Elimination)</h2>
<p>ساده‌ترین فرمت. یک شکست و از مسابقه حذف می‌شوید. مزیت اصلی این فرمت سرعت آن است. در تورنامنت‌های کوچک یا فینال‌ها از این فرمت استفاده می‌شود.</p>
<h2>۲. حذفی دوگانه (Double Elimination)</h2>
<p>در این فرمت دو براکت وجود دارد: Winners و Losers. تا زمانی که دو بار شکست نخورده‌اید از مسابقه حذف نمی‌شوید. این فرمت فرصت دوباره می‌دهد اما زمان بیشتری می‌برد.</p>
<h2>۳. دوره‌ای (Round Robin)</h2>
<p>هر تیم با تمام تیم‌های دیگر یک بار بازی می‌کند. برنده کسی است که بیشترین امتیاز را کسب کند. این فرمت عادلانه‌ترین است اما نیاز به زمان بسیار بیشتری دارد.</p>
<h2>کدام فرمت را انتخاب کنیم؟</h2>
<table>
  <tr><th>فرمت</th><th>مناسب برای</th></tr>
  <tr><td>حذفی تکی</td><td>فینال‌ها، تورنامنت‌های سریع</td></tr>
  <tr><td>حذفی دوگانه</td><td>تورنامنت‌های میان‌رده</td></tr>
  <tr><td>دوره‌ای</td><td>لیگ‌ها، تعیین سطح</td></tr>
</table>`,
        status: 'published',
        publishedAt: plusDays(-16),
        viewCount: 1650,
      },

      // ── Rule ──
      {
        type: 'rule',
        slug: 'fa-official-tournament-rules',
        title: 'قوانین رسمی مسابقات دراگون اسپورت ۱۴۰۴',
        excerpt: 'متن کامل قوانین و مقررات حاکم بر تمام مسابقات رسمی دراگون اسپورت در سال ۱۴۰۴، شامل آیین‌نامه رفتاری، مقررات فنی و روش‌های حل اختلاف.',
        bodyHtml: `<p>این سند قوانین رسمی حاکم بر تمام مسابقات سازمان‌یافته توسط دراگون اسپورت را تشریح می‌کند. شرکت در هر مسابقه به معنای پذیرش کامل این قوانین است.</p>
<h2>ماده ۱: شرایط شرکت</h2>
<p>تمام شرکت‌کنندگان باید سن قانونی (۱۸ سال) داشته باشند یا با تأییدیه والدین شرکت کنند. داشتن حساب کاربری فعال و تأییدشده در دراگون اسپورت الزامی است.</p>
<h2>ماده ۲: آیین‌نامه رفتاری</h2>
<p>هرگونه رفتار توهین‌آمیز، نژادپرستانه یا خشونت‌آمیز در طول مسابقه ممنوع است. این شامل چت درون‌بازی، شبکه‌های اجتماعی و هر تعامل مرتبط با مسابقه می‌شود.</p>
<h2>ماده ۳: مقررات فنی</h2>
<ul>
  <li>استفاده از هرگونه نرم‌افزار کمکی یا Cheat موجب محرومیت دائمی است</li>
  <li>اتصال به VPN در حین مسابقه ممنوع است مگر با اجازه مسابقه‌دهنده</li>
  <li>بازیکن مسئول پایداری اتصال اینترنت خود است</li>
  <li>مشکلات فنی در صورت اعلام به‌موقع بررسی می‌شوند</li>
</ul>
<h2>ماده ۴: تخطی از قوانین</h2>
<p>بسته به شدت تخلف، مجازات‌ها از اخطار ساده تا محرومیت دائمی متغیر است. تمام تصمیمات مدیریت مسابقه قطعی است مگر اینکه به کمیته انضباطی ارجاع شود.</p>
<h2>ماده ۵: تغییرات قوانین</h2>
<p>دراگون اسپورت حق اعمال تغییرات در این قوانین را محفوظ می‌دارد. هرگونه تغییر از طریق اعلان رسمی در وب‌سایت به اطلاع همه خواهد رسید.</p>`,
        status: 'published',
        publishedAt: plusDays(-20),
        viewCount: 890,
      },
    ];

    const featuredIds = [featuredTag._id];
    const valorantIds = [valorantTag._id];
    const dota2Ids = [dota2Tag._id];
    const cs2Ids = [cs2Tag._id];
    const tournamentIds = [tournamentTag._id];

    const postTagMap: Record<string, Types.ObjectId[]> = {
      'fa-valorant-season2-launch': [...featuredIds, ...valorantIds, ...tournamentIds],
      'fa-esports-growth-analysis': [...featuredIds],
      'fa-tournament-registration-guide': [...featuredIds, ...tournamentIds],
      'fa-season-1404-announcement': [...featuredIds, ...tournamentIds],
      'fa-dragon-platform-launch': [...featuredIds],
      'fa-cs2-update-news': [...cs2Ids],
      'fa-dota2-patch-notes': [...dota2Ids],
      'fa-mobile-cup-recap': [],
      'fa-lol-new-season': [],
      'fa-eafc-cup-news': [...tournamentIds],
      'fa-meta-analysis-valorant': [...valorantIds],
      'fa-team-strategy-guide': [...dota2Ids],
      'fa-valorant-beginner-guide': [...valorantIds],
      'fa-bracket-system-guide': [...tournamentIds],
      'fa-official-tournament-rules': [...tournamentIds],
    };

    const postCategoryMap: Record<string, Types.ObjectId[]> = {
      'fa-valorant-season2-launch': [newsCategory._id, valorantTag._id],
      'fa-esports-growth-analysis': [analysisCategory._id],
      'fa-tournament-registration-guide': [guidesCategory._id],
      'fa-season-1404-announcement': [officialCategory._id],
      'fa-dragon-platform-launch': [newsCategory._id],
      'fa-cs2-update-news': [newsCategory._id],
      'fa-dota2-patch-notes': [newsCategory._id],
      'fa-mobile-cup-recap': [newsCategory._id],
      'fa-lol-new-season': [newsCategory._id],
      'fa-eafc-cup-news': [newsCategory._id],
      'fa-meta-analysis-valorant': [analysisCategory._id],
      'fa-team-strategy-guide': [analysisCategory._id],
      'fa-valorant-beginner-guide': [guidesCategory._id],
      'fa-bracket-system-guide': [guidesCategory._id],
      'fa-official-tournament-rules': [officialCategory._id],
    };

    const legacyCategoryIds = allCategories.slice(0, 3).map((c) => c._id);
    const legacyTagIds = allTags.slice(0, 3).map((t) => t._id);

    for (const post of postInputs) {
      const tagIds = post.slug.startsWith('phase1-')
        ? legacyTagIds
        : (postTagMap[post.slug] ?? []);
      const categoryIds = post.slug.startsWith('phase1-')
        ? legacyCategoryIds
        : (postCategoryMap[post.slug] ?? [newsCategory._id]);

      await this.upsert(
        this.postModel,
        { type: post.type, slugNormalized: post.slug },
        {
          type: post.type,
          title: post.title,
          slug: post.slug,
          slugNormalized: post.slug,
          slugHistory: [],
          excerpt: post.excerpt,
          bodyJson: { type: 'doc', content: [] },
          bodyHtml: post.bodyHtml,
          mediaRefs: [],
          categoryIds,
          tagIds,
          status: post.status,
          authorId: editor._id,
          seo: {
            title: post.title,
            description: post.excerpt,
            noIndex: true,
          },
          viewCount: post.viewCount ?? 0,
          ...(post.publishedAt !== undefined ? { publishedAt: post.publishedAt } : {}),
        },
      );
    }

    for (const page of [
      { title: 'Phase 1 Local About', slug: 'phase1-local-about', status: 'published' },
      { title: 'Phase 1 Local Rules', slug: 'phase1-local-rules', status: 'draft' },
    ] as const) {
      await this.upsert(
        this.pageModel,
        { slugNormalized: page.slug },
        {
          title: page.title,
          slug: page.slug,
          slugNormalized: page.slug,
          slugHistory: [],
          bodyJson: { type: 'doc', content: [] },
          bodyHtml: `<p>${page.title} page generated for local development testing.</p>`,
          status: page.status,
          seo: {
            title: page.title,
            description: `${page.title} local development sample.`,
            noIndex: true,
          },
          createdBy: editor._id,
          updatedBy: editor._id,
          ...(page.status === 'published' ? { publishedAt: plusDays(-1) } : {}),
        },
      );
    }

    return { mediaAsset };
  }

  private async seedGames(): Promise<GameSeedMap> {
    const output = {} as GameSeedMap;

    const gameCovers: Partial<Record<string, SeedDocument>> = {};
    for (const [slug, fileName] of [
      ['valorant', 'game-valorant-cover.jpg'],
      ['dota-2', 'game-dota2-cover.jpg'],
      ['counter-strike-2', 'game-cs2-cover.jpg'],
    ] as const) {
      const checksum = `${DEV_SEED_REQUEST_ID_PREFIX}media-game-cover-${slug}`;
      gameCovers[slug] = await this.upsert(
        this.mediaAssetModel,
        { checksum },
        {
          originalName: fileName,
          fileName,
          mimeType: 'image/jpeg',
          extension: 'jpg',
          sizeBytes: 92000,
          storageProvider: 'local',
          bucket: 'dragon-local',
          objectKey: `${DEV_SEED_REQUEST_ID_PREFIX}media/${fileName}`,
          visibility: 'public',
          variants: [],
          width: 1280,
          height: 720,
          alt: `${slug} game cover`,
          status: 'ready',
          checksum,
        },
      );
    }

    const games = [
      ['valorant', 'Valorant', 'Tactical FPS tournaments and local bracket testing.', 'active'],
      ['ea-fc', 'EA FC', 'Football esports cups and manual tournament demos.', 'active'],
      ['dota-2', 'Dota 2', 'MOBA round-robin standings and match testing.', 'active'],
      ['counter-strike-2', 'Counter-Strike 2', 'FPS registration-closed and manual match states.', 'active'],
      ['league-of-legends', 'League of Legends', 'Completed and archived season examples.', 'active'],
      ['mobile-legends', 'Mobile Legends', 'Inactive game with cancelled tournament example.', 'inactive'],
    ] as const;

    for (const [slug, name, description, status] of games) {
      const coverDoc = gameCovers[slug];
      output[slug] = await this.upsert(
        this.gameModel,
        { slugNormalized: slug },
        {
          name,
          slug,
          slugNormalized: slug,
          description,
          status,
          ...(coverDoc !== undefined ? { coverMediaId: idOf(coverDoc) } : {}),
        },
      );
    }

    return output;
  }

  private async seedTournaments(games: GameSeedMap): Promise<TournamentSeedMap> {
    const output = {} as TournamentSeedMap;
    const inputs: readonly TournamentSeedInput[] = [
      {
        slug: 'valorant-open-registration-local',
        title: 'Valorant Open Registration Local',
        game: 'valorant',
        format: 'single_elimination',
        status: 'registration_open',
        capacity: 8,
        registrationOpenAt: plusDays(-2),
        registrationCloseAt: plusDays(5),
        startsAt: plusDays(7),
        endsAt: plusDays(8),
        publishedAt: plusDays(-3),
      },
      {
        slug: 'valorant-full-capacity-local',
        title: 'Valorant Full Capacity Local',
        game: 'valorant',
        format: 'single_elimination',
        status: 'registration_open',
        capacity: 2,
        registrationOpenAt: plusDays(-3),
        registrationCloseAt: plusDays(4),
        startsAt: plusDays(6),
        endsAt: plusDays(6),
        publishedAt: plusDays(-4),
      },
      {
        slug: 'dota-round-robin-live-local',
        title: 'Dota Round Robin Live Local',
        game: 'dota-2',
        format: 'round_robin',
        status: 'in_progress',
        capacity: 6,
        registrationOpenAt: plusDays(-20),
        registrationCloseAt: plusDays(-4),
        startsAt: plusDays(-1),
        endsAt: plusDays(2),
        publishedAt: plusDays(-21),
      },
      {
        slug: 'cs2-manual-showcase-local',
        title: 'CS2 Manual Showcase Local',
        game: 'counter-strike-2',
        format: 'manual',
        status: 'published',
        capacity: 4,
        registrationOpenAt: plusDays(2),
        registrationCloseAt: plusDays(8),
        startsAt: plusDays(10),
        endsAt: plusDays(11),
        publishedAt: plusDays(-1),
      },
      {
        slug: 'league-completed-finals-local',
        title: 'League Completed Finals Local',
        game: 'league-of-legends',
        format: 'single_elimination',
        status: 'completed',
        capacity: 4,
        registrationOpenAt: plusDays(-30),
        registrationCloseAt: plusDays(-20),
        startsAt: plusDays(-10),
        endsAt: plusDays(-8),
        publishedAt: plusDays(-31),
      },
      {
        slug: 'mobile-cancelled-cup-local',
        title: 'Mobile Legends Cancelled Cup Local',
        game: 'mobile-legends',
        format: 'manual',
        status: 'cancelled',
        capacity: 8,
        registrationOpenAt: plusDays(-12),
        registrationCloseAt: plusDays(-7),
        startsAt: plusDays(1),
        endsAt: plusDays(1),
        publishedAt: plusDays(-13),
        cancelledAt: plusDays(-6),
      },
      {
        slug: 'ea-fc-draft-admin-local',
        title: 'EA FC Draft Admin Local',
        game: 'ea-fc',
        format: 'manual',
        status: 'draft',
        capacity: 16,
        registrationOpenAt: plusDays(10),
        registrationCloseAt: plusDays(20),
        startsAt: plusDays(25),
        endsAt: plusDays(26),
      },
      {
        slug: 'valorant-upcoming-registration-local',
        title: 'Valorant Upcoming Registration Local',
        game: 'valorant',
        format: 'round_robin',
        status: 'published',
        capacity: 6,
        registrationOpenAt: plusDays(3),
        registrationCloseAt: plusDays(12),
        startsAt: plusDays(15),
        endsAt: plusDays(17),
        publishedAt: plusDays(-1),
      },
      {
        slug: 'cs2-registration-closed-local',
        title: 'CS2 Registration Closed Local',
        game: 'counter-strike-2',
        format: 'single_elimination',
        status: 'registration_closed',
        capacity: 4,
        registrationOpenAt: plusDays(-14),
        registrationCloseAt: plusDays(-1),
        startsAt: plusDays(3),
        endsAt: plusDays(4),
        publishedAt: plusDays(-15),
      },
      {
        slug: 'league-archived-season-local',
        title: 'League Archived Season Local',
        game: 'league-of-legends',
        format: 'round_robin',
        status: 'archived',
        capacity: 6,
        registrationOpenAt: plusDays(-60),
        registrationCloseAt: plusDays(-45),
        startsAt: plusDays(-40),
        endsAt: plusDays(-35),
        publishedAt: plusDays(-61),
        archivedAt: plusDays(-5),
      },
    ];

    const posterChecksum = `${DEV_SEED_REQUEST_ID_PREFIX}media-tournament-poster-valorant-open`;
    const tournamentPoster = await this.upsert(
      this.mediaAssetModel,
      { checksum: posterChecksum },
      {
        originalName: 'tournament-valorant-open-poster.jpg',
        fileName: 'tournament-valorant-open-poster.jpg',
        mimeType: 'image/jpeg',
        extension: 'jpg',
        sizeBytes: 140000,
        storageProvider: 'local',
        bucket: 'dragon-local',
        objectKey: `${DEV_SEED_REQUEST_ID_PREFIX}media/tournament-valorant-open-poster.jpg`,
        visibility: 'public',
        variants: [],
        width: 1200,
        height: 630,
        alt: 'Valorant Open Registration poster',
        status: 'ready',
        checksum: posterChecksum,
      },
    );

    for (const tournament of inputs) {
      const game = games[tournament.game];
      const coverMediaId =
        tournament.slug === 'valorant-open-registration-local' ? idOf(tournamentPoster) : undefined;
      output[tournament.slug] = await this.upsert(
        this.tournamentModel,
        { slugNormalized: tournament.slug },
        {
          title: tournament.title,
          slug: tournament.slug,
          slugNormalized: tournament.slug,
          description: `${tournament.title} seeded for local UI/API state coverage.`,
          gameId: idOf(game),
          format: tournament.format,
          status: tournament.status,
          participantType: tournament.format === 'manual' ? 'both' : 'individual',
          capacity: tournament.capacity,
          registrationOpenAt: tournament.registrationOpenAt,
          registrationCloseAt: tournament.registrationCloseAt,
          startsAt: tournament.startsAt,
          endsAt: tournament.endsAt,
          rules: 'Local development sample rules. No prizes, payments, or streaming fields.',
          ...(tournament.publishedAt !== undefined ? { publishedAt: tournament.publishedAt } : {}),
          ...(tournament.cancelledAt !== undefined ? { cancelledAt: tournament.cancelledAt } : {}),
          ...(tournament.archivedAt !== undefined ? { archivedAt: tournament.archivedAt } : {}),
          ...(coverMediaId !== undefined ? { coverMediaId } : {}),
        },
      );
    }

    return output;
  }

  private async seedRegistrations(
    accounts: AccountSeedMap,
    tournaments: TournamentSeedMap,
  ): Promise<Record<string, SeedDocument[]>> {
    const playerEmails = DEV_TEST_ACCOUNTS.filter((account) => account.email.startsWith('player')).map(
      (account) => account.email,
    );
    const playerDocs = playerEmails.map((email) => accounts[email as keyof AccountSeedMap]);
    const byTournament: Record<string, SeedDocument[]> = {};

    const add = async (input: {
      readonly tournamentSlug: keyof TournamentSeedMap;
      readonly playerIndex: number;
      readonly status: string;
      readonly type?: 'individual' | 'team';
      readonly teamName?: string;
      readonly seed?: number;
      readonly removed?: boolean;
      readonly disqualified?: boolean;
    }): Promise<SeedDocument> => {
      const tournament = tournaments[input.tournamentSlug];
      const player = playerDocs[input.playerIndex];
      if (!player) throw new Error(`Missing player index ${input.playerIndex}.`);
      const displayName = String(player.get('email') ?? `player-${input.playerIndex + 1}`);
      const statusDates = this.registrationStatusDates(input.status);
      const doc = await this.upsert(
        this.registrationModel,
        { tournamentId: tournament._id, userId: idOf(player) },
        {
          tournamentId: tournament._id,
          userId: idOf(player),
          type: input.type ?? 'individual',
          status: input.status,
          teamName: input.teamName,
          members:
            input.type === 'team'
              ? [
                  {
                    userId: idOf(player),
                    displayName,
                    role: 'captain',
                  },
                ]
              : undefined,
          submittedAt: plusDays(-10 + input.playerIndex),
          participantDisplayName: displayName,
          ...(input.seed !== undefined ? { seed: input.seed } : {}),
          ...(input.removed ? { participantRemovedAt: plusDays(-1) } : {}),
          ...(input.disqualified ? { participantDisqualifiedAt: plusDays(-1) } : {}),
          ...statusDates,
        },
      );
      const key = input.tournamentSlug;
      byTournament[key] = [...(byTournament[key] ?? []), doc];
      return doc;
    };

    await add({ tournamentSlug: 'valorant-open-registration-local', playerIndex: 0, status: 'submitted' });
    await add({ tournamentSlug: 'valorant-open-registration-local', playerIndex: 1, status: 'approved', seed: 1 });
    await add({ tournamentSlug: 'valorant-open-registration-local', playerIndex: 2, status: 'rejected' });
    await add({ tournamentSlug: 'valorant-open-registration-local', playerIndex: 3, status: 'waitlisted' });

    await add({ tournamentSlug: 'valorant-full-capacity-local', playerIndex: 0, status: 'approved', seed: 1 });
    await add({ tournamentSlug: 'valorant-full-capacity-local', playerIndex: 1, status: 'approved', seed: 2 });

    for (let i = 0; i < 6; i += 1) {
      await add({ tournamentSlug: 'dota-round-robin-live-local', playerIndex: i, status: 'approved', seed: i + 1 });
    }

    await add({ tournamentSlug: 'cs2-manual-showcase-local', playerIndex: 0, status: 'submitted', type: 'team', teamName: 'Local Dragons' });
    await add({ tournamentSlug: 'cs2-manual-showcase-local', playerIndex: 1, status: 'withdrawn' });

    for (let i = 0; i < 4; i += 1) {
      await add({ tournamentSlug: 'league-completed-finals-local', playerIndex: i, status: 'approved', seed: i + 1 });
    }

    await add({ tournamentSlug: 'mobile-cancelled-cup-local', playerIndex: 4, status: 'cancelled' });
    await add({ tournamentSlug: 'cs2-registration-closed-local', playerIndex: 2, status: 'approved', seed: 1, removed: true });
    await add({ tournamentSlug: 'cs2-registration-closed-local', playerIndex: 3, status: 'approved', seed: 2, disqualified: true });

    return byTournament;
  }

  private registrationStatusDates(status: string): Record<string, Date | string> {
    if (status === 'approved') return { approvedAt: plusDays(-5) };
    if (status === 'rejected') return { rejectedAt: plusDays(-4), rejectedReason: 'Local seed rejection sample.' };
    if (status === 'withdrawn') return { withdrawnAt: plusDays(-3) };
    if (status === 'cancelled') return { cancelledAt: plusDays(-2) };
    return {};
  }

  private async seedMatches(
    tournaments: TournamentSeedMap,
    registrations: Record<string, SeedDocument[]>,
  ): Promise<void> {
    const add = async (input: {
      readonly tournamentSlug: keyof TournamentSeedMap;
      readonly round: number;
      readonly matchNumber: number;
      readonly status: string;
      readonly p1?: number;
      readonly p2?: number;
      readonly winner?: 1 | 2;
      readonly score?: readonly [number, number];
    }): Promise<void> => {
      const tournament = tournaments[input.tournamentSlug];
      const participants = registrations[input.tournamentSlug] ?? [];
      const participant1 = input.p1 !== undefined ? participants[input.p1] : undefined;
      const participant2 = input.p2 !== undefined ? participants[input.p2] : undefined;
      const winner = input.winner === 1 ? participant1 : input.winner === 2 ? participant2 : undefined;
      await this.upsert(
        this.matchModel,
        { tournamentId: tournament._id, round: input.round, matchNumber: input.matchNumber },
        {
          tournamentId: tournament._id,
          round: input.round,
          matchNumber: input.matchNumber,
          status: input.status,
          ...(participant1 !== undefined ? { participant1Id: participant1._id } : {}),
          ...(participant2 !== undefined ? { participant2Id: participant2._id } : {}),
          ...(winner !== undefined ? { winnerId: winner._id } : {}),
          scheduledAt: plusDays(input.round),
          ...(input.status === 'completed' ? { completedAt: plusDays(input.round + 1) } : {}),
          notes: `${PHASE1_DEV_SEED_BATCH} local match state sample.`,
          ...(input.score !== undefined
            ? {
                participant1Score: input.score[0],
                participant2Score: input.score[1],
                resultNotes: 'Local seed result sample.',
                resultRecordedAt: plusDays(input.round + 1),
              }
            : {}),
          generatedAt: plusDays(-1),
        },
      );
    };

    await add({ tournamentSlug: 'valorant-full-capacity-local', round: 1, matchNumber: 1, status: 'scheduled', p1: 0, p2: 1 });

    await add({ tournamentSlug: 'dota-round-robin-live-local', round: 1, matchNumber: 1, status: 'completed', p1: 0, p2: 1, winner: 1, score: [13, 9] });
    await add({ tournamentSlug: 'dota-round-robin-live-local', round: 1, matchNumber: 2, status: 'in_progress', p1: 2, p2: 3 });
    await add({ tournamentSlug: 'dota-round-robin-live-local', round: 1, matchNumber: 3, status: 'scheduled', p1: 4, p2: 5 });

    await add({ tournamentSlug: 'league-completed-finals-local', round: 1, matchNumber: 1, status: 'completed', p1: 0, p2: 1, winner: 1, score: [2, 0] });
    await add({ tournamentSlug: 'league-completed-finals-local', round: 1, matchNumber: 2, status: 'completed', p1: 2, p2: 3, winner: 2, score: [1, 2] });
    await add({ tournamentSlug: 'league-completed-finals-local', round: 2, matchNumber: 1, status: 'completed', p1: 0, p2: 3, winner: 1, score: [3, 1] });

    await add({ tournamentSlug: 'cs2-manual-showcase-local', round: 1, matchNumber: 1, status: 'cancelled', p1: 0, p2: 1 });
  }

  private async seedNotifications(accounts: AccountSeedMap): Promise<void> {
    for (const template of [
      {
        key: 'tournament.registration_submitted.local',
        body: 'Local test: registration submitted for {{tournamentTitle}}.',
        variables: ['tournamentTitle'],
      },
      {
        key: 'tournament.registration_approved.local',
        body: 'Local test: registration approved for {{tournamentTitle}}.',
        variables: ['tournamentTitle'],
      },
      {
        key: 'tournament.registration_rejected.local',
        body: 'Local test: registration rejected for {{tournamentTitle}}.',
        variables: ['tournamentTitle'],
      },
      {
        key: 'tournament.cancelled.local',
        body: 'Local test: tournament {{tournamentTitle}} was cancelled.',
        variables: ['tournamentTitle'],
      },
    ]) {
      await this.upsert(
        this.notificationTemplateModel,
        { key: template.key, channel: 'sms', locale: 'en-US' },
        {
          key: template.key,
          channel: 'sms',
          locale: 'en-US',
          body: template.body,
          variables: template.variables,
          isActive: true,
        },
      );
    }

    const logs = [
      ['registration submitted', 'tournament.registration_submitted.local', 'sent', accounts['player1@dragon.local']],
      ['registration approved', 'tournament.registration_approved.local', 'queued', accounts['player2@dragon.local']],
      ['registration rejected', 'tournament.registration_rejected.local', 'failed', accounts['player3@dragon.local']],
      ['tournament cancelled', 'tournament.cancelled.local', 'skipped', accounts['player5@dragon.local']],
    ] as const;

    for (const [purpose, templateKey, status, user] of logs) {
      await this.upsert(
        this.notificationLogModel,
        { requestId: requestId(`notification:${purpose}`) },
        {
          channel: 'sms',
          provider: 'local-dev-mock',
          recipientMasked: '+98***0101',
          recipientHash: requestId(`recipient:${idOf(user)}`),
          templateKey,
          purpose,
          status,
          providerMessageId: status === 'sent' ? requestId(`provider:${purpose}`) : undefined,
          errorCode: status === 'failed' ? 'LOCAL_DEV_FAILURE_SAMPLE' : undefined,
          errorMessage: status === 'failed' ? 'Local-only seeded failure sample.' : undefined,
          requestId: requestId(`notification:${purpose}`),
          correlationId: requestId(`notification-correlation:${purpose}`),
        },
      );
    }
  }

  private async seedOperationalLogs(
    accounts: AccountSeedMap,
    tournaments: TournamentSeedMap,
    mediaAsset: SeedDocument,
  ): Promise<void> {
    const admin = accounts['admin@dragon.local'];
    const organizer = accounts['organizer@dragon.local'];
    const editor = accounts['editor@dragon.local'];
    const tournament = tournaments['valorant-open-registration-local'];

    const auditInputs = [
      {
        actorId: admin._id,
        actorType: 'admin',
        action: AuditAction.TOURNAMENT_CREATED,
        resourceType: 'tournament',
        resourceId: idOf(tournament),
        severity: 'info',
      },
      {
        actorId: organizer._id,
        actorType: 'admin',
        action: AuditAction.REGISTRATION_APPROVED,
        resourceType: 'tournament_registration',
        resourceId: idOf(tournament),
        severity: 'info',
      },
      {
        actorId: editor._id,
        actorType: 'admin',
        action: AuditAction.MEDIA_ASSET_UPLOADED,
        resourceType: 'media_asset',
        resourceId: idOf(mediaAsset),
        severity: 'info',
      },
    ] as const;

    for (const audit of auditInputs) {
      await this.upsert(
        this.auditLogModel,
        { requestId: requestId(`audit:${audit.action}`) },
        {
          ...audit,
          metadata: { seedSource: PHASE1_DEV_SEED_SOURCE, seedBatch: PHASE1_DEV_SEED_BATCH },
          ip: '127.0.0.1',
          userAgent: 'phase1-dev-seed',
          requestId: requestId(`audit:${audit.action}`),
          correlationId: requestId(`audit-correlation:${audit.action}`),
        },
      );
    }

    for (const event of [
      { type: 'tournament.viewed', resourceType: 'tournament', resourceId: idOf(tournament) },
      {
        type: 'tournament.registration_started',
        resourceType: 'tournament',
        resourceId: idOf(tournament),
      },
      {
        type: 'tournament.registration_completed',
        resourceType: 'tournament',
        resourceId: idOf(tournament),
      },
      { type: 'tournament.bracket_viewed', resourceType: 'tournament', resourceId: idOf(tournament) },
      { type: 'tournament.match_viewed', resourceType: 'tournament_match', resourceId: idOf(tournament) },
    ] as const) {
      await this.upsert(
        this.analyticsEventModel,
        { anonymousId: requestId(`analytics:${event.type}`) },
        {
          ...event,
          userId: accounts['player1@dragon.local']._id,
          anonymousId: requestId(`analytics:${event.type}`),
          metadata: { seedSource: PHASE1_DEV_SEED_SOURCE, seedBatch: PHASE1_DEV_SEED_BATCH },
          ipHash: requestId('ip:local'),
          userAgent: 'phase1-dev-seed',
        },
      );
    }

    for (const job of [
      { queueName: 'search', jobName: 'search.reindex_all', status: 'completed', attempts: 1 },
      { queueName: 'sms', jobName: 'notification.sms.send', status: 'failed', attempts: 3 },
    ] as const) {
      await this.upsert(
        this.jobLogModel,
        { bullJobId: requestId(`job:${job.queueName}:${job.jobName}`) },
        {
          ...job,
          bullJobId: requestId(`job:${job.queueName}:${job.jobName}`),
          maxAttempts: 3,
          payloadSummary: { seedSource: PHASE1_DEV_SEED_SOURCE, scope: 'local' },
          startedAt: plusDays(-1),
          completedAt: job.status === 'completed' ? NOW : undefined,
          error: job.status === 'failed' ? 'Local-only seeded job failure sample.' : undefined,
        },
      );
    }

    await this.upsert(
      this.backupLogModel,
      { fileKey: requestId('backup:mongodb') },
      {
        type: 'mongodb',
        status: 'completed',
        fileKey: requestId('backup:mongodb'),
        bucket: 'dragon-local',
        sizeBytes: 2048,
        startedAt: plusDays(-2),
        completedAt: plusDays(-2),
        triggeredBy: 'manual_script',
        actorId: admin._id,
      },
    );
  }

  private async countSeededRecords(): Promise<SeedCounts> {
    const userIds = await this.findSeedUserIds();
    const tournamentIds = await this.findSeedTournamentIds();

    return {
      users: await this.count(this.userModel, {
        emailNormalized: { $in: DEV_TEST_ACCOUNTS.map((account) => account.email) },
      }),
      profiles: await this.count(this.profileModel, { userId: { $in: userIds } }),
      roles: await this.count(this.roleModel, { key: { $in: RoleRegistry.map((role) => role.key) } }),
      userRoles: await this.count(this.userRoleModel, { userId: { $in: userIds } }),
      permissions: await this.count(this.permissionModel, {
        key: { $in: PermissionRegistry.map((permission) => permission.key) },
      }),
      games: await this.count(this.gameModel, { slugNormalized: { $in: [...DEV_SEED_GAME_SLUGS] } }),
      tournaments: await this.count(this.tournamentModel, {
        slugNormalized: { $in: [...DEV_SEED_TOURNAMENT_SLUGS] },
      }),
      registrations: await this.count(this.registrationModel, {
        tournamentId: { $in: tournamentIds },
      }),
      matches: await this.count(this.matchModel, { tournamentId: { $in: tournamentIds } }),
      notificationLogs: await this.count(this.notificationLogModel, {
        requestId: { $regex: `^${DEV_SEED_REQUEST_ID_PREFIX}` },
      }),
      notificationTemplates: await this.count(this.notificationTemplateModel, {
        key: { $in: [...DEV_SEED_NOTIFICATION_TEMPLATE_KEYS] },
      }),
      auditLogs: await this.count(this.auditLogModel, {
        requestId: { $regex: `^${DEV_SEED_REQUEST_ID_PREFIX}` },
      }),
      analyticsEvents: await this.count(this.analyticsEventModel, {
        anonymousId: { $regex: `^${DEV_SEED_REQUEST_ID_PREFIX}` },
      }),
      categories: await this.count(this.categoryModel, {
        slugNormalized: { $in: [...DEV_SEED_CONTENT_CATEGORY_SLUGS] },
      }),
      tags: await this.count(this.tagModel, { slugNormalized: { $in: [...DEV_SEED_CONTENT_TAG_SLUGS] } }),
      posts: await this.count(this.postModel, { slugNormalized: { $in: [...DEV_SEED_POST_SLUGS] } }),
      pages: await this.count(this.pageModel, { slugNormalized: { $in: [...DEV_SEED_PAGE_SLUGS] } }),
      mediaAssets: await this.count(this.mediaAssetModel, {
        checksum: { $regex: `^${DEV_SEED_REQUEST_ID_PREFIX}` },
      }),
      jobLogs: await this.count(this.jobLogModel, {
        bullJobId: { $regex: `^${DEV_SEED_REQUEST_ID_PREFIX}` },
      }),
      backupLogs: await this.count(this.backupLogModel, {
        fileKey: { $regex: `^${DEV_SEED_REQUEST_ID_PREFIX}` },
      }),
    };
  }

  private async findSeedUserIds(): Promise<Types.ObjectId[]> {
    const users = await asSeedModel(this.userModel)
      .find(
        { emailNormalized: { $in: DEV_TEST_ACCOUNTS.map((account) => account.email) } },
        { _id: 1 },
      )
      .exec();
    return users.map((user) => objectId(user._id));
  }

  private async findSeedTournamentIds(): Promise<Types.ObjectId[]> {
    const tournaments = await asSeedModel(this.tournamentModel)
      .find({ slugNormalized: { $in: [...DEV_SEED_TOURNAMENT_SLUGS] } }, { _id: 1 })
      .exec();
    return tournaments.map((tournament) => objectId(tournament._id));
  }

  private async upsert<T>(
    model: Model<T>,
    filter: Record<string, unknown>,
    set: object,
  ): Promise<SeedDocument> {
    const cleanSet = Object.fromEntries(
      Object.entries(set).filter(([, value]) => value !== undefined),
    );
    const doc = await asSeedModel(model)
      .findOneAndUpdate(
        filter,
        {
          $set: cleanSet,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    if (!doc) {
      throw new Error('Seed upsert failed to return a document.');
    }

    return doc;
  }

  private async deleteMany<T>(model: Model<T>, filter: Record<string, unknown>): Promise<number> {
    const result = await asSeedModel(model).deleteMany(filter).exec();
    return result.deletedCount ?? 0;
  }

  private async count<T>(model: Model<T>, filter: Record<string, unknown>): Promise<number> {
    return asSeedModel(model).countDocuments(filter).exec();
  }
}
