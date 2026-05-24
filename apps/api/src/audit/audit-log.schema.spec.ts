import { AuditLog, AuditLogSchema } from './audit-log.schema';

describe('AuditLog schema', () => {
  it('has the correct collection name', () => {
    expect(AuditLogSchema.get('collection')).toBe('audit_logs');
  });

  it('has all required locked fields', () => {
    const paths = AuditLogSchema.paths;
    expect(paths['actorType']).toBeDefined();
    expect(paths['action']).toBeDefined();
    expect(paths['resourceType']).toBeDefined();
    expect(paths['severity']).toBeDefined();
    expect(paths['createdAt']).toBeDefined();
  });

  it('has optional locked fields', () => {
    const paths = AuditLogSchema.paths;
    expect(paths['actorId']).toBeDefined();
    expect(paths['resourceId']).toBeDefined();
    expect(paths['before']).toBeDefined();
    expect(paths['after']).toBeDefined();
    expect(paths['metadata']).toBeDefined();
    expect(paths['ip']).toBeDefined();
    expect(paths['userAgent']).toBeDefined();
    expect(paths['requestId']).toBeDefined();
    expect(paths['correlationId']).toBeDefined();
  });

  it('does not have updatedAt (append-only)', () => {
    const paths = AuditLogSchema.paths;
    expect(paths['updatedAt']).toBeUndefined();
  });

  it('actorType is required', () => {
    const path = AuditLogSchema.path('actorType');
    expect(path.isRequired).toBe(true);
  });

  it('action is required', () => {
    const path = AuditLogSchema.path('action');
    expect(path.isRequired).toBe(true);
  });

  it('resourceType is required', () => {
    const path = AuditLogSchema.path('resourceType');
    expect(path.isRequired).toBe(true);
  });

  it('severity is required with default info', () => {
    const path = AuditLogSchema.path('severity') as unknown as {
      isRequired: boolean;
      defaultValue: unknown;
    };
    expect(path.isRequired).toBe(true);
    expect(path.defaultValue).toBe('info');
  });

  it('actorType enum is locked to allowed values', () => {
    const path = AuditLogSchema.path('actorType') as unknown as { enumValues: string[] };
    expect(path.enumValues).toEqual(expect.arrayContaining(['user', 'admin', 'system', 'job']));
    expect(path.enumValues).toHaveLength(4);
  });

  it('severity enum is locked to allowed values', () => {
    const path = AuditLogSchema.path('severity') as unknown as { enumValues: string[] };
    expect(path.enumValues).toEqual(expect.arrayContaining(['info', 'warning', 'critical']));
    expect(path.enumValues).toHaveLength(3);
  });

  it('has required indexes defined', () => {
    const indexes = AuditLogSchema.indexes();
    const indexKeys = indexes.map(([key]) => JSON.stringify(Object.keys(key).sort()));

    expect(indexKeys).toContain(JSON.stringify(['actorId', 'createdAt'].sort()));
    expect(indexKeys).toContain(JSON.stringify(['createdAt']));
    expect(indexKeys).toContain(JSON.stringify(['action', 'createdAt'].sort()));
    expect(indexKeys).toContain(JSON.stringify(['requestId']));
    expect(indexKeys).toContain(JSON.stringify(['resourceId', 'resourceType', 'createdAt'].sort()));
  });

  it('class is defined', () => {
    expect(AuditLog).toBeDefined();
    expect(AuditLogSchema).toBeDefined();
  });
});
