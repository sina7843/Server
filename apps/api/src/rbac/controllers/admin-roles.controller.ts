import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { AttachPermissionDto } from '../dto/attach-permission.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import {
  RbacGenericResponse,
  createRbacGenericResponse,
} from '../dto/rbac-response.dto';
import {
  RoleResponse,
  RolesResponse,
  toRoleResponse,
} from '../dto/role-response.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import {
  validateAttachPermissionDto,
  validateCreateRoleDto,
  validateObjectId,
  validateUpdateRoleDto,
} from '../dto/rbac-validation';
import { PermissionGuard } from '../guards/permission.guard';
import { PermissionService } from '../permissions/permission.service';
import { Permissions } from '../registry/permission-keys';
import { RolePermissionService } from '../role-permissions/role-permission.service';
import { RoleService } from '../roles/role.service';

@Controller('admin/v1/roles')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminRolesController {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
    private readonly rolePermissionService: RolePermissionService,
  ) {}

  @Get()
  @RequirePermission(Permissions.RBAC_ROLE_READ)
  async listRoles(): Promise<RolesResponse> {
    const roles = await this.roleService.list();

    return { roles: roles.map(toRoleResponse) };
  }

  @Post()
  @RequirePermission(Permissions.RBAC_ROLE_CREATE)
  async createRole(@Body() body: CreateRoleDto): Promise<RoleResponse> {
    const role = await this.roleService.createAdminRole(
      validateCreateRoleDto(body as unknown as Record<string, unknown>),
    );

    return toRoleResponse(role);
  }

  @Get(':id')
  @RequirePermission(Permissions.RBAC_ROLE_READ)
  async getRole(@Param('id') roleId: string): Promise<RoleResponse> {
    const role = await this.roleService.findById(validateObjectId(roleId, 'id'));

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    return toRoleResponse(role);
  }

  @Patch(':id')
  @RequirePermission(Permissions.RBAC_ROLE_UPDATE)
  async updateRole(
    @Param('id') roleId: string,
    @Body() body: UpdateRoleDto,
  ): Promise<RoleResponse> {
    const role = await this.roleService.updateAdminRole(
      validateObjectId(roleId, 'id'),
      validateUpdateRoleDto(body as unknown as Record<string, unknown>),
    );

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    return toRoleResponse(role);
  }

  @Delete(':id')
  @RequirePermission(Permissions.RBAC_ROLE_DEACTIVATE)
  async deactivateRole(@Param('id') roleId: string): Promise<RbacGenericResponse> {
    await this.roleService.deactivateAdminRole(validateObjectId(roleId, 'id'));

    return createRbacGenericResponse('Role deactivated.');
  }

  @Post(':id/permissions')
  @RequirePermission(Permissions.RBAC_PERMISSION_ATTACH)
  async attachPermission(
    @Param('id') roleId: string,
    @Body() body: AttachPermissionDto,
  ): Promise<RbacGenericResponse> {
    const validRoleId = validateObjectId(roleId, 'id');
    const input = validateAttachPermissionDto(
      body as unknown as Record<string, unknown>,
    );
    const role = await this.roleService.findById(validRoleId);
    const permission = await this.permissionService.findById(input.permissionId);

    if (!role || !role.isActive || !permission) {
      throw new NotFoundException('Role or permission not found.');
    }

    await this.rolePermissionService.attachPermission({
      roleId: validRoleId,
      permissionId: input.permissionId,
    });

    return createRbacGenericResponse('Permission attached to role.');
  }

  @Delete(':id/permissions/:permissionId')
  @RequirePermission(Permissions.RBAC_PERMISSION_DETACH)
  async detachPermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
  ): Promise<RbacGenericResponse> {
    await this.rolePermissionService.detachPermission({
      roleId: validateObjectId(roleId, 'id'),
      permissionId: validateObjectId(permissionId, 'permissionId'),
    });

    return createRbacGenericResponse('Permission detached from role.');
  }
}
