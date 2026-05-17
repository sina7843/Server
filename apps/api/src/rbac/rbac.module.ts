import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AdminPermissionsController } from './controllers/admin-permissions.controller';
import { AdminRolesController } from './controllers/admin-roles.controller';
import { AdminUserRolesController } from './controllers/admin-user-roles.controller';
import { ObjectPolicyGuard } from './guards/object-policy.guard';
import { PermissionGuard } from './guards/permission.guard';
import { ObjectPolicyService } from './policies/object-policy.service';
import { PermissionRepository } from './permissions/permission.repository';
import { Permission, PermissionSchema } from './permissions/permission.schema';
import { PermissionService } from './permissions/permission.service';
import { PermissionResolverService } from './resolution/permission-resolver.service';
import { RolePermissionRepository } from './role-permissions/role-permission.repository';
import { RolePermission, RolePermissionSchema } from './role-permissions/role-permission.schema';
import { RolePermissionService } from './role-permissions/role-permission.service';
import { RoleRepository } from './roles/role.repository';
import { Role, RoleSchema } from './roles/role.schema';
import { RoleService } from './roles/role.service';
import { RbacSeedService } from './seeds/rbac-seed.service';
import { UserRoleRepository } from './user-roles/user-role.repository';
import { UserRole, UserRoleSchema } from './user-roles/user-role.schema';
import { UserRoleService } from './user-roles/user-role.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: UserRole.name, schema: UserRoleSchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
    ]),
  ],
  controllers: [AdminRolesController, AdminPermissionsController, AdminUserRolesController],
  providers: [
    RoleRepository,
    RoleService,
    PermissionRepository,
    PermissionService,
    UserRoleRepository,
    UserRoleService,
    RolePermissionRepository,
    RolePermissionService,
    RbacSeedService,
    PermissionResolverService,
    PermissionGuard,
    ObjectPolicyService,
    ObjectPolicyGuard,
  ],
  exports: [
    RoleRepository,
    RoleService,
    PermissionRepository,
    PermissionService,
    UserRoleRepository,
    UserRoleService,
    RolePermissionRepository,
    RolePermissionService,
    RbacSeedService,
    PermissionResolverService,
    PermissionGuard,
    ObjectPolicyService,
    ObjectPolicyGuard,
  ],
})
export class RbacModule {}
