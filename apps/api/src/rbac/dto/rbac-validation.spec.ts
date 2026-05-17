import { BadRequestException } from '@nestjs/common';
import {
  validateAssignUserRoleDto,
  validateAttachPermissionDto,
  validateCreateRoleDto,
  validateObjectId,
  validateUpdateRoleDto,
} from './rbac-validation';

const objectId = '64f000000000000000000001';

describe('RBAC DTO validation', () => {
  it('accepts a valid role create body', () => {
    expect(
      validateCreateRoleDto({
        key: 'editor',
        name: 'Editor',
        description: 'Can edit foundation resources.',
        isAssignable: true,
      }),
    ).toEqual({
      key: 'editor',
      name: 'Editor',
      description: 'Can edit foundation resources.',
      isAssignable: true,
    });
  });

  it('rejects invalid role key format', () => {
    expect(() =>
      validateCreateRoleDto({ key: 'Bad-Key', name: 'Bad role' }),
    ).toThrow(BadRequestException);
  });

  it('rejects unknown and internal create-role fields', () => {
    expect(() =>
      validateCreateRoleDto({
        key: 'editor',
        name: 'Editor',
        isSystem: true,
      }),
    ).toThrow(BadRequestException);
  });

  it('validates update role body and rejects key mutation', () => {
    expect(validateUpdateRoleDto({ name: 'Updated', isActive: false })).toEqual({
      name: 'Updated',
      isActive: false,
    });

    expect(() => validateUpdateRoleDto({ key: 'new_key' })).toThrow(
      BadRequestException,
    );
  });

  it('validates ObjectId params and body ids', () => {
    expect(validateObjectId(objectId, 'id')).toBe(objectId);
    expect(validateAttachPermissionDto({ permissionId: objectId })).toEqual({
      permissionId: objectId,
    });
    expect(() => validateAttachPermissionDto({ permissionId: 'bad' })).toThrow(
      BadRequestException,
    );
  });

  it('validates assign user role body', () => {
    expect(
      validateAssignUserRoleDto({
        roleId: objectId,
        scopeType: 'organization',
        scopeId: 'org-1',
        expiresAt: '2030-01-01T00:00:00.000Z',
      }),
    ).toEqual({
      roleId: objectId,
      scopeType: 'organization',
      scopeId: 'org-1',
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
  });

  it('rejects invalid expiresAt and unknown assign fields', () => {
    expect(() =>
      validateAssignUserRoleDto({ roleId: objectId, expiresAt: 'bad-date' }),
    ).toThrow(BadRequestException);

    expect(() =>
      validateAssignUserRoleDto({ roleId: objectId, assignedBy: objectId }),
    ).toThrow(BadRequestException);
  });
});
