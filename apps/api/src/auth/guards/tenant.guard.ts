import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  MembershipStatus,
  SchoolStatus,
  SupportAccessStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { isPlatformRole, isPlatformSuperAdmin } from '../platform-roles';

const BLOCKED_SCHOOL_STATUSES: SchoolStatus[] = [
  SchoolStatus.SUSPENDED,
  SchoolStatus.DEACTIVATED,
  SchoolStatus.REJECTED,
  SchoolStatus.EXPIRED,
];

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    const rawSchoolId = request.headers['x-school-id'] ?? request.params?.schoolId;
    const schoolId = Array.isArray(rawSchoolId) ? rawSchoolId[0] : rawSchoolId;

    // Only the canonical platform super admin bypasses tenant checks. Platform
    // operations and support roles must use tenant-scoped endpoints or an
    // approved support-access grant.
    if (isPlatformSuperAdmin(user.roles ?? [])) {
      if (typeof schoolId === 'string' && schoolId.trim()) {
        request.schoolId = schoolId.trim();
      }
      return true;
    }

    if (typeof schoolId !== 'string' || !schoolId.trim()) {
      throw new ForbiddenException('School context missing');
    }

    const tenantId = schoolId.trim();

    const rawGrantId = request.headers['x-support-grant-id'];
    const grantId = Array.isArray(rawGrantId) ? rawGrantId[0] : rawGrantId;
    if (typeof grantId === 'string' && grantId.trim()) {
      const isPlatformUser = (user.roles ?? []).some((role: string) =>
        isPlatformRole(role),
      );
      if (!isPlatformUser) {
        throw new ForbiddenException('Support access is restricted to platform staff.');
      }

      if (!['GET', 'HEAD'].includes(request.method)) {
        throw new ForbiddenException(
          'Support access is read-only. Tenant changes require the school administrator.',
        );
      }

      const grant = await this.prisma.supportAccessGrant.findUnique({
        where: { id: grantId.trim() },
      });

      if (
        !grant ||
        grant.schoolId !== tenantId ||
        grant.requestedById !== user.id ||
        grant.status !== SupportAccessStatus.APPROVED ||
        !grant.expiresAt ||
        grant.expiresAt <= new Date()
      ) {
        throw new ForbiddenException(
          'Support access grant is invalid, expired, or does not cover this school.',
        );
      }

      if (!grant.scope.includes('READ_ONLY')) {
        throw new ForbiddenException('Support access grant has an unsupported scope.');
      }

      await this.prisma.supportAccessGrant.update({
        where: { id: grant.id },
        data: { lastUsedAt: new Date(), useCount: { increment: 1 } },
      });

      request.schoolId = tenantId;
      request.supportAccessGrantId = grant.id;
      request.isSupportAccess = true;
      return true;
    }

    const membership = await this.prisma.schoolMembership.findUnique({
      where: {
        schoolId_userId: {
          schoolId: tenantId,
          userId: user.id,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('You do not belong to this school');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true },
    });

    if (!school) {
      throw new ForbiddenException('School workspace not found');
    }

    if (BLOCKED_SCHOOL_STATUSES.includes(school.status)) {
      throw new ForbiddenException(
        'This school workspace is not available. Please contact your school administrator.',
      );
    }

    request.schoolId = tenantId;
    request.school = school;

    return true;
  }
}
