import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SupportAccessStatus,
  SchoolStatus,
  SecuritySeverity,
} from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SecurityEventService } from '../../security/services/security-event.service';

const MAX_ACTIVE_GRANT_MINUTES = 240;

@Injectable()
export class SupportAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly securityEvents: SecurityEventService,
  ) {}

  async list(params: { status?: SupportAccessStatus; schoolId?: string }) {
    await this.expireStaleGrants();

    const grants = await this.prisma.supportAccessGrant.findMany({
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.schoolId ? { schoolId: params.schoolId } : {}),
      },
      include: {
        school: { select: { id: true, name: true, code: true, status: true } },
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { items: grants, total: grants.length };
  }

  async request(
    dto: { schoolId: string; reason: string; durationMinutes?: number },
    actorId: string,
  ) {
    const reason = dto.reason?.trim();
    if (!reason || reason.length < 10) {
      throw new BadRequestException(
        'Provide a support reason of at least 10 characters.',
      );
    }

    const durationMinutes = dto.durationMinutes ?? 60;
    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 15 ||
      durationMinutes > MAX_ACTIVE_GRANT_MINUTES
    ) {
      throw new BadRequestException(
        `Support access must last between 15 and ${MAX_ACTIVE_GRANT_MINUTES} minutes.`,
      );
    }

    const school = await this.prisma.school.findUnique({
      where: { id: dto.schoolId },
      select: { id: true, name: true, code: true, status: true },
    });
    if (!school) throw new NotFoundException('School not found');
    if (school.status === SchoolStatus.DEACTIVATED) {
      throw new BadRequestException('Cannot request support access to a deactivated school.');
    }

    const existing = await this.prisma.supportAccessGrant.findFirst({
      where: {
        schoolId: dto.schoolId,
        requestedById: actorId,
        status: { in: [SupportAccessStatus.REQUESTED, SupportAccessStatus.APPROVED] },
      },
    });
    if (existing) {
      throw new ConflictException(
        'You already have a pending or active support access grant for this school.',
      );
    }

    const grant = await this.prisma.supportAccessGrant.create({
      data: {
        schoolId: dto.schoolId,
        requestedById: actorId,
        reason,
        requestedMinutes: durationMinutes,
        scope: ['READ_ONLY'],
        status: SupportAccessStatus.REQUESTED,
      },
      include: {
        school: { select: { id: true, name: true, code: true, status: true } },
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId: dto.schoolId,
      action: 'SUPPORT_ACCESS_REQUESTED',
      module: 'SECURITY',
      resourceId: grant.id,
      metadata: {
        reason,
        requestedMinutes: durationMinutes,
        scope: grant.scope,
      },
    });

    return grant;
  }

  async approve(grantId: string, actorId: string) {
    const grant = await this.prisma.supportAccessGrant.findUnique({
      where: { id: grantId },
      include: { school: { select: { id: true, name: true, code: true } } },
    });
    if (!grant) throw new NotFoundException('Support access request not found');
    if (grant.status !== SupportAccessStatus.REQUESTED) {
      throw new BadRequestException('Only pending support requests can be approved.');
    }
    if (grant.requestedById === actorId) {
      throw new ForbiddenException(
        'Support access requests cannot be approved by the requester.',
      );
    }
    if (grant.requestedMinutes > MAX_ACTIVE_GRANT_MINUTES) {
      throw new BadRequestException('Requested support duration exceeds policy.');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + grant.requestedMinutes * 60_000);

    const approved = await this.prisma.supportAccessGrant.update({
      where: { id: grantId },
      data: {
        status: SupportAccessStatus.APPROVED,
        approvedById: actorId,
        approvedAt: now,
        expiresAt,
      },
      include: {
        school: { select: { id: true, name: true, code: true } },
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId: grant.schoolId,
      action: 'SUPPORT_ACCESS_APPROVED',
      module: 'SECURITY',
      resourceId: grant.id,
      metadata: {
        requesterId: grant.requestedById,
        expiresAt,
        scope: grant.scope,
      },
    });

    await this.securityEvents.logEvent({
      userId: actorId,
      schoolId: grant.schoolId,
      eventType: 'SUPPORT_ACCESS_APPROVED' as any,
      severity: SecuritySeverity.MEDIUM,
      metadata: {
        grantId: grant.id,
        requesterId: grant.requestedById,
        expiresAt,
      },
    });

    return approved;
  }

  async revoke(grantId: string, actorId: string) {
    const grant = await this.prisma.supportAccessGrant.findUnique({
      where: { id: grantId },
    });
    if (!grant) throw new NotFoundException('Support access grant not found');
    if (
      grant.status !== SupportAccessStatus.APPROVED &&
      grant.status !== SupportAccessStatus.REQUESTED
    ) {
      throw new BadRequestException('This support access grant is not active.');
    }

    const revoked = await this.prisma.supportAccessGrant.update({
      where: { id: grantId },
      data: {
        status: SupportAccessStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId: grant.schoolId,
      action: 'SUPPORT_ACCESS_REVOKED',
      module: 'SECURITY',
      resourceId: grant.id,
      metadata: { requesterId: grant.requestedById },
    });

    return revoked;
  }

  async expireStaleGrants() {
    const now = new Date();
    await this.prisma.supportAccessGrant.updateMany({
      where: {
        status: SupportAccessStatus.APPROVED,
        expiresAt: { lte: now },
      },
      data: { status: SupportAccessStatus.EXPIRED },
    });
  }
}
