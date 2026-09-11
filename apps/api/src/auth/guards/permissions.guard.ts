import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const schoolId = request.schoolId; // Should be set by TenantGuard

    if (!user) return false;
    if (user.roles?.includes('SUPER_ADMIN')) return true;

    // Fetch user permissions for the current school
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId: user.id,
        schoolId: schoolId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const userPermissions = userRoles.flatMap(ur =>
      ur.role.permissions.map(rp => rp.permission.name)
    );

    return requiredPermissions.every((permission) => userPermissions.includes(permission));
  }
}
