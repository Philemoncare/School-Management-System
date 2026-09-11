import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Platform Super Admin bypasses tenant checks for global operations
    if (user.roles?.includes('SUPER_ADMIN')) {
      return true;
    }

    const schoolId = request.headers['x-school-id'] || request.params.schoolId;

    if (!schoolId) {
      throw new ForbiddenException('School context missing');
    }

    const membership = await this.prisma.schoolMembership.findUnique({
      where: {
        schoolId_userId: {
          schoolId: schoolId,
          userId: user.id,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('You do not belong to this school');
    }

    // Inject tenant ID into request for use in services
    request.schoolId = schoolId;

    return true;
  }
}
