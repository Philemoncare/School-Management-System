import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import {
  expandRoleAliases,
  isPlatformSuperAdmin,
  platformPermissionsFor,
  schoolPermissionsFor,
} from '../platform-roles';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const schoolId = request.schoolId;

    if (!user) return false;

    const expandedRoles = expandRoleAliases(user.roles ?? []);
    if (isPlatformSuperAdmin(expandedRoles)) return true;

    const platformPermissions = new Set(platformPermissionsFor(expandedRoles));

    // Fetch persisted school permissions for the active school.
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId: user.id,
        schoolId: schoolId ?? null,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>(platformPermissions);
    for (const permission of schoolPermissionsFor(
      userRoles.map((userRole) => userRole.role.name),
    )) {
      permissions.add(permission);
    }
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        permissions.add(rolePermission.permission.name);
      }
    }

    return requiredPermissions.every(
      (permission) => permissions.has(permission) || permissions.has('*'),
    );
  }
}
