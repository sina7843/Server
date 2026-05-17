export const createRbacTestToken = (permissionKeys: readonly string[] = []) => ({
  accessToken: 'test-access-token',
  permissionKeys,
});
