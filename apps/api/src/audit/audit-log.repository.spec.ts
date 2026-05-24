import type { Model } from 'mongoose';
import { AuditLogRepository } from './audit-log.repository';
import type { AuditLogDocument } from './audit-log.schema';

function makeRepository() {
  const create = jest.fn().mockResolvedValue({ _id: 'audit-id-1' });
  const exec = jest.fn().mockResolvedValue(null);
  const findById = jest.fn().mockReturnValue({ exec });
  const model = { create, findById } as unknown as Model<AuditLogDocument>;

  return { repository: new AuditLogRepository(model), create, findById, exec };
}

describe('AuditLogRepository', () => {
  it('creates an audit log with required fields', async () => {
    const { repository, create } = makeRepository();

    await repository.create({
      actorType: 'user',
      action: 'auth.login_success',
      resourceType: 'auth',
      severity: 'info',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'user',
        action: 'auth.login_success',
        resourceType: 'auth',
        severity: 'info',
      }),
    );
  });

  it('sets severity to info by default when not provided', async () => {
    const { repository, create } = makeRepository();

    await repository.create({
      actorType: 'system',
      action: 'rbac.role_created',
      resourceType: 'role',
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }));
  });

  it('includes actorId as ObjectId when provided', async () => {
    const { repository, create } = makeRepository();

    await repository.create({
      actorType: 'user',
      action: 'auth.logout',
      resourceType: 'auth',
      actorId: '507f1f77bcf86cd799439011',
    });

    const called = create.mock.calls[0][0] as Record<string, unknown>;
    expect(called['actorId']).toBeDefined();
    expect(String(called['actorId'])).toBe('507f1f77bcf86cd799439011');
  });

  it('includes optional request metadata when provided', async () => {
    const { repository, create } = makeRepository();

    await repository.create({
      actorType: 'user',
      action: 'auth.login_success',
      resourceType: 'auth',
      ip: '1.2.3.4',
      userAgent: 'TestBrowser/1.0',
      requestId: 'req-abc-123',
      correlationId: 'corr-xyz-456',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: '1.2.3.4',
        userAgent: 'TestBrowser/1.0',
        requestId: 'req-abc-123',
        correlationId: 'corr-xyz-456',
      }),
    );
  });

  it('omits undefined optional fields', async () => {
    const { repository, create } = makeRepository();

    await repository.create({
      actorType: 'system',
      action: 'rbac.role_created',
      resourceType: 'role',
    });

    const called = create.mock.calls[0][0] as Record<string, unknown>;
    expect(called['actorId']).toBeUndefined();
    expect(called['ip']).toBeUndefined();
    expect(called['userAgent']).toBeUndefined();
    expect(called['requestId']).toBeUndefined();
    expect(called['correlationId']).toBeUndefined();
  });

  it('finds audit log by id', async () => {
    const { repository, findById } = makeRepository();

    await repository.findById('audit-id-1');

    expect(findById).toHaveBeenCalledWith('audit-id-1');
  });

  it('does not expose an update method', () => {
    const { repository } = makeRepository();
    expect('update' in repository).toBe(false);
    expect('updateOne' in repository).toBe(false);
    expect('updateMany' in repository).toBe(false);
  });

  it('does not expose a delete method', () => {
    const { repository } = makeRepository();
    expect('delete' in repository).toBe(false);
    expect('deleteOne' in repository).toBe(false);
    expect('softDelete' in repository).toBe(false);
    expect('hardDelete' in repository).toBe(false);
  });

  it('creates audit log with before and after objects', async () => {
    const { repository, create } = makeRepository();

    await repository.create({
      actorType: 'admin',
      action: 'rbac.role_updated',
      resourceType: 'role',
      resourceId: 'role-123',
      before: { name: 'Old Name', isActive: true },
      after: { name: 'New Name', isActive: true },
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        before: { name: 'Old Name', isActive: true },
        after: { name: 'New Name', isActive: true },
        resourceId: 'role-123',
      }),
    );
  });

  it('creates audit log with warning severity', async () => {
    const { repository, create } = makeRepository();

    await repository.create({
      actorType: 'user',
      action: 'auth.login_failed',
      resourceType: 'auth',
      severity: 'warning',
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warning' }));
  });
});
