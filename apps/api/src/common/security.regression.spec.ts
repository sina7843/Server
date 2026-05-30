/**
 * Security regression tests for Phase 0 hardening pass (Task 0.11.1).
 *
 * These tests cover the minimum required regression items listed in the
 * slice 0.11 security hardening spec. Each test is independent and does not
 * require a running database or external services.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

import { AuditRedactor } from '../audit/audit-redactor';
import { AnalyticsRedactor } from '../analytics/analytics-redactor';
import { JobPayloadRedactor } from '../jobs/job-payload-redactor';
import { getCorsConfig } from '../config/cors.config';
import { OtpChallengeSchema } from '../auth/otp/otp-challenge.schema';
import { parsePublicContentSearchQuery } from '../search/dto/public-search-query';
import { parsePublicListQuery } from '../content/public/public-posts.service';
import { parseAdminAuditQuery } from '../admin/audit/dto/admin-audit-query';
import { validateObjectId } from '../rbac/dto/rbac-validation';

// ---------------------------------------------------------------------------
// CORS configuration
// ---------------------------------------------------------------------------

describe('CORS configuration', () => {
  it('does not use wildcard origin when CORS_ALLOWED_ORIGINS is unset', () => {
    const { allowedOrigins } = getCorsConfig({});
    expect(allowedOrigins).not.toContain('*');
    expect(allowedOrigins).toHaveLength(0);
  });

  it('strips wildcard from allowed origins (no wildcard with credentials)', () => {
    const { allowedOrigins } = getCorsConfig({ CORS_ALLOWED_ORIGINS: '*' });
    expect(allowedOrigins).not.toContain('*');
    expect(allowedOrigins).toHaveLength(0);
  });

  it('allowlists specific origins without wildcard', () => {
    const { allowedOrigins } = getCorsConfig({
      CORS_ALLOWED_ORIGINS: 'https://web.example.com,https://admin.example.com',
    });
    expect(allowedOrigins).toContain('https://web.example.com');
    expect(allowedOrigins).toContain('https://admin.example.com');
    expect(allowedOrigins).not.toContain('*');
  });
});

// ---------------------------------------------------------------------------
// Audit redactor — case-variant and nested sensitive keys
// ---------------------------------------------------------------------------

describe('AuditRedactor — case-variant and nested keys', () => {
  const redactor = new AuditRedactor();

  it('redacts Password (mixed case)', () => {
    const r = redactor.redact({ Password: 'secret' });
    expect(r.Password).toBe('[REDACTED]');
  });

  it('redacts PASSWORD (uppercase)', () => {
    const r = redactor.redact({ PASSWORD: 'secret' });
    expect(r.PASSWORD).toBe('[REDACTED]');
  });

  it('redacts AccessToken (mixed case)', () => {
    const r = redactor.redact({ AccessToken: 'jwt-tok' });
    expect(r.AccessToken).toBe('[REDACTED]');
  });

  it('redacts Authorization (mixed case)', () => {
    const r = redactor.redact({ Authorization: 'Bearer tok' });
    expect(r.Authorization).toBe('[REDACTED]');
  });

  it('redacts Otp (mixed case)', () => {
    const r = redactor.redact({ Otp: '654321' });
    expect(r.Otp).toBe('[REDACTED]');
  });

  it('redacts nested mixed-case secret keys', () => {
    const r = redactor.redact({ payload: { RefreshToken: 'tok', userId: 'u1' } });
    const payload = r.payload as Record<string, unknown>;
    expect(payload.RefreshToken).toBe('[REDACTED]');
    expect(payload.userId).toBe('u1');
  });

  it('redacts deeply nested secrets', () => {
    const r = redactor.redact({ a: { b: { c: { PASSWORD: 'deep' } } } });
    const deepest = ((r.a as Record<string, unknown>).b as Record<string, unknown>).c as Record<
      string,
      unknown
    >;
    expect(deepest.PASSWORD).toBe('[REDACTED]');
  });

  it('audit output does not contain raw OTP value', () => {
    const r = redactor.redact({ rawOtp: '999888', userId: 'u1' });
    expect(JSON.stringify(r)).not.toContain('999888');
  });
});

// ---------------------------------------------------------------------------
// Analytics redactor — case-variant sensitive keys
// ---------------------------------------------------------------------------

describe('AnalyticsRedactor — case-variant and nested keys', () => {
  const redactor = new AnalyticsRedactor();

  it('redacts Password (mixed case)', () => {
    const r = redactor.redact({ Password: 'secret' });
    expect((r as Record<string, unknown>).Password).toBe('[REDACTED]');
  });

  it('redacts AccessToken (mixed case)', () => {
    const r = redactor.redact({ AccessToken: 'jwt' });
    expect((r as Record<string, unknown>).AccessToken).toBe('[REDACTED]');
  });

  it('redacts recipient phone (case-insensitive)', () => {
    const r = redactor.redact({ Recipient: '+989001234567' });
    expect((r as Record<string, unknown>).Recipient).toBe('[REDACTED]');
  });

  it('analytics output does not contain raw OTP', () => {
    const r = redactor.redact({ otp: '123456', userId: 'u1' });
    expect(JSON.stringify(r)).not.toContain('123456');
  });
});

// ---------------------------------------------------------------------------
// Job payload redactor — case-insensitive (regression for prior case-sensitive bug)
// ---------------------------------------------------------------------------

describe('JobPayloadRedactor — case-insensitive redaction', () => {
  const redactor = new JobPayloadRedactor();

  it('redacts Password (mixed case)', () => {
    const r = redactor.redact({ Password: 'secret' });
    expect(r['Password']).toBe('[REDACTED]');
  });

  it('redacts PASSWORD (uppercase)', () => {
    const r = redactor.redact({ PASSWORD: 'secret' });
    expect(r['PASSWORD']).toBe('[REDACTED]');
  });

  it('redacts RefreshToken (mixed case)', () => {
    const r = redactor.redact({ RefreshToken: 'tok' });
    expect(r['RefreshToken']).toBe('[REDACTED]');
  });

  it('redacts AccessToken (mixed case)', () => {
    const r = redactor.redact({ AccessToken: 'jwt-tok' });
    expect(r['AccessToken']).toBe('[REDACTED]');
  });

  it('redacts Authorization (mixed case)', () => {
    const r = redactor.redact({ Authorization: 'Bearer tok' });
    expect(r['Authorization']).toBe('[REDACTED]');
  });

  it('job output does not expose raw OTP under any casing', () => {
    const r = redactor.redact({ Otp: '777888', userId: 'u1' });
    expect(JSON.stringify(r)).not.toContain('777888');
  });

  it('job output does not expose raw password under any casing', () => {
    const r = redactor.redact({ PASSWORD: 'hunter2' });
    expect(JSON.stringify(r)).not.toContain('hunter2');
  });
});

// ---------------------------------------------------------------------------
// OTP schema — raw code never stored
// ---------------------------------------------------------------------------

describe('OTP schema — raw code invariant', () => {
  it('OtpChallenge schema has codeHash field (not rawCode or code)', () => {
    const paths = (OtpChallengeSchema as unknown as { paths: Record<string, unknown> }).paths;
    expect(paths).toHaveProperty('codeHash');
    expect(paths).not.toHaveProperty('rawCode');
    expect(paths).not.toHaveProperty('code');
  });
});

// ---------------------------------------------------------------------------
// Pagination caps — public content search
// ---------------------------------------------------------------------------

describe('Pagination caps — public content search', () => {
  it('accepts limit of 50 (maximum allowed)', () => {
    const q = parsePublicContentSearchQuery({ limit: '50', page: '1' });
    expect(q.limit).toBe(50);
  });

  it('rejects limit > 50 with BadRequestException', () => {
    expect(() => parsePublicContentSearchQuery({ limit: '51', page: '1' })).toThrow();
  });

  it('rejects limit of 0', () => {
    expect(() => parsePublicContentSearchQuery({ limit: '0', page: '1' })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Pagination caps — public post listing
// ---------------------------------------------------------------------------

describe('Pagination caps — public post listing', () => {
  it('caps limit at 50', () => {
    const q = parsePublicListQuery({ limit: '9999', page: '1' });
    expect(q.limit).toBeLessThanOrEqual(50);
  });

  it('uses default limit for non-numeric input', () => {
    const q = parsePublicListQuery({ limit: 'abc', page: '1' });
    expect(q.limit).toBeGreaterThan(0);
    expect(q.limit).toBeLessThanOrEqual(50);
  });
});

// ---------------------------------------------------------------------------
// Pagination caps — admin audit query
// ---------------------------------------------------------------------------

describe('Pagination caps — admin audit query', () => {
  it('rejects limit above 100', () => {
    expect(() => parseAdminAuditQuery({ limit: '101', page: '1' })).toThrow();
  });

  it('accepts limit of 100', () => {
    const q = parseAdminAuditQuery({ limit: '100', page: '1' });
    expect(q.limit).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// ObjectId validation — RBAC
// ---------------------------------------------------------------------------

describe('ObjectId validation — RBAC DTOs', () => {
  it('accepts a valid 24-hex ObjectId', () => {
    expect(() => validateObjectId('507f1f77bcf86cd799439011', 'id')).not.toThrow();
  });

  it('rejects an empty string', () => {
    expect(() => validateObjectId('', 'id')).toThrow();
  });

  it('rejects a non-hex string', () => {
    expect(() => validateObjectId('not-an-object-id', 'id')).toThrow();
  });

  it('rejects a 23-character hex (too short)', () => {
    expect(() => validateObjectId('507f1f77bcf86cd79943901', 'id')).toThrow();
  });

  it('rejects a 25-character hex (too long)', () => {
    expect(() => validateObjectId('507f1f77bcf86cd7994390110', 'id')).toThrow();
  });

  it('rejects null', () => {
    expect(() => validateObjectId(null, 'id')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ObjectId validation — public search query
// ---------------------------------------------------------------------------

describe('ObjectId validation — public search categoryId/tagId', () => {
  it('rejects invalid categoryId', () => {
    expect(() =>
      parsePublicContentSearchQuery({
        q: 'hello',
        categoryId: 'not-an-id',
        page: '1',
        limit: '20',
      }),
    ).toThrow();
  });

  it('rejects invalid tagId', () => {
    expect(() =>
      parsePublicContentSearchQuery({ q: 'hello', tagId: 'not-an-id', page: '1', limit: '20' }),
    ).toThrow();
  });

  it('accepts valid ObjectId for categoryId', () => {
    expect(() =>
      parsePublicContentSearchQuery({
        q: 'hello',
        categoryId: '507f1f77bcf86cd799439011',
        page: '1',
        limit: '20',
      }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Permission guard — deny by default
// ---------------------------------------------------------------------------

describe('PermissionGuard — deny-by-default invariant', () => {
  it('PermissionGuard source contains deny-by-default for missing metadata', () => {
    const src = readFileSync(join(__dirname, '../rbac/guards/permission.guard.ts'), 'utf8');
    expect(src).toContain('ForbiddenException');
    expect(src).toContain('permissionKeys.length === 0');
  });
});

// ---------------------------------------------------------------------------
// Public content — no draft/archived/deleted leakage
// ---------------------------------------------------------------------------

describe('Public content filtering — no draft/archived/deleted leakage', () => {
  it('listPublished passes status: published and includeDeleted: false', () => {
    const src = readFileSync(join(__dirname, '../content/public/public-posts.service.ts'), 'utf8');
    expect(src).toContain("status: 'published'");
    expect(src).toContain('includeDeleted: false');
  });

  it('getPublished calls findPublishedByTypeAndSlug (not findByTypeAndSlug)', () => {
    const src = readFileSync(join(__dirname, '../content/public/public-posts.service.ts'), 'utf8');
    expect(src).toContain('findPublishedByTypeAndSlug');
  });
});

// ---------------------------------------------------------------------------
// Backup API — no credential exposure in responses
// ---------------------------------------------------------------------------

describe('Backup API — credential exposure invariant', () => {
  it('BackupService sanitizes errors before logging (no raw URI in logs)', () => {
    const src = readFileSync(join(__dirname, '../backups/backup.service.ts'), 'utf8');
    // sanitizeError must be called before logger.error — raw MongoDB URI must never be logged directly
    expect(src).toContain('sanitizeError');
    expect(src).toContain('this.logger.error');
  });

  it('BackupLogDto does not include connection string fields', () => {
    const src = readFileSync(join(__dirname, '../backups/backup-log.schema.ts'), 'utf8');
    expect(src).not.toContain('connectionString');
    expect(src).not.toContain('mongoUri');
  });
});

// ---------------------------------------------------------------------------
// Health endpoints — no secret exposure
// ---------------------------------------------------------------------------

describe('Health endpoints — no secret exposure', () => {
  it('HealthService checkStorage returns only status, not provider value', () => {
    const src = readFileSync(join(__dirname, '../health/health.service.ts'), 'utf8');
    // status is always 'ok' or 'unknown' — never the raw env var value
    expect(src).toContain("status: 'ok'");
    expect(src).toContain("'unknown'");
    // env vars are used only as boolean conditions, not returned as values
    expect(src).not.toMatch(/return\s+process\.env/);
  });

  it('HealthService never returns connection strings', () => {
    const src = readFileSync(join(__dirname, '../health/health.service.ts'), 'utf8');
    expect(src).not.toContain('MONGODB_URI');
    expect(src).not.toContain('REDIS_HOST');
    expect(src).not.toContain('connectionString');
  });
});

// ---------------------------------------------------------------------------
// Frontend token storage — no localStorage
// ---------------------------------------------------------------------------

describe('Frontend token storage — no localStorage', () => {
  function grepLocalStorage(dir: string, includes: string[]): string[] {
    const includeArgs = includes.map((p) => `--include="${p}"`).join(' ');
    let output = '';
    try {
      output = execSync(`grep -r "localStorage" "${dir}" ${includeArgs} --exclude="*.spec.ts" -l`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch {
      output = '';
    }
    return output
      .trim()
      .split('\n')
      .filter((l) => l.length > 0);
  }

  it('apps/admin has no localStorage token usage', () => {
    const adminDir = join(__dirname, '../../../../apps/admin');
    const matches = grepLocalStorage(adminDir, ['*.ts', '*.vue']);
    expect(matches).toHaveLength(0);
  });

  it('apps/web has no localStorage token usage', () => {
    const webDir = join(__dirname, '../../../../apps/web');
    const matches = grepLocalStorage(webDir, ['*.ts', '*.vue']);
    expect(matches).toHaveLength(0);
  });

  it('packages/sdk has no localStorage token persistence', () => {
    const sdkDir = join(__dirname, '../../../../packages/sdk');
    const matches = grepLocalStorage(sdkDir, ['*.ts']);
    expect(matches).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// No readable access token cookie
// ---------------------------------------------------------------------------

describe('No readable access token cookie', () => {
  it('auth controller does not set an access token cookie', () => {
    const src = readFileSync(join(__dirname, '../auth/auth.controller.ts'), 'utf8');
    expect(src).not.toMatch(/res\.cookie\s*\(\s*['"]accessToken['"]/);
    expect(src).not.toMatch(/res\.cookie\s*\(\s*['"]access_token['"]/);
  });

  it('TokenResponseDto does not have a cookie field', () => {
    const src = readFileSync(join(__dirname, '../auth/dto/token-response.dto.ts'), 'utf8');
    expect(src).not.toContain('cookieValue');
    expect(src).not.toContain('httpOnly');
  });
});
