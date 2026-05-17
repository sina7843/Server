export const RBAC_ADMIN_ENDPOINTS = [
  'GET /admin/v1/roles',
  'POST /admin/v1/roles',
  'GET /admin/v1/roles/:id',
  'PATCH /admin/v1/roles/:id',
  'DELETE /admin/v1/roles/:id',
  'GET /admin/v1/permissions',
  'POST /admin/v1/roles/:id/permissions',
  'DELETE /admin/v1/roles/:id/permissions/:permissionId',
  'POST /admin/v1/users/:id/roles',
  'DELETE /admin/v1/users/:id/roles/:userRoleId',
] as const;

export const FORBIDDEN_PERMISSION_ENDPOINTS = [
  'POST /admin/v1/permissions',
  'PATCH /admin/v1/permissions/:id',
  'DELETE /admin/v1/permissions/:id',
] as const;
