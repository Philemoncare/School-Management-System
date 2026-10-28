import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionService } from './session.service';
import { SecurityEventService } from './security-event.service';
import { SecuritySeverity, SecurityEventType } from '@prisma/client';

@Injectable()
export class ImpersonationService {
  constructor(
    private prisma: PrismaService,
    private sessionService: SessionService,
    private securityEventService: SecurityEventService,
  ) {}

  async startImpersonation(adminId: string, targetUserId: string, reason: string, context: any) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      include: { userRoles: { include: { role: true } } }
    });

    if (!admin || !admin.userRoles.some(ur => ur.role.name === 'SUPER_ADMIN')) {
      throw new ForbiddenException('Only Super Admins can impersonate users');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { userRoles: { include: { role: true } } }
    });

    if (!targetUser) throw new NotFoundException('Target user not found');

    if (targetUser.userRoles.some(ur => ur.role.name === 'SUPER_ADMIN')) {
      throw new ForbiddenException('Cannot impersonate another Super Admin');
    }

    if (!reason) throw new BadRequestException('Reason for impersonation is required');

    // Create a special session for impersonation
    const { token, session } = await this.sessionService.createSession({
      userId: targetUserId,
      ipAddress: context.ip,
      userAgent: context.userAgent,
      expiresInMinutes: 30, // Impersonation sessions are short-lived
    });

    await this.securityEventService.logEvent({
      userId: adminId,
      eventType: SecurityEventType.ADMIN_IMPERSONATION_STARTED as any,
      severity: SecuritySeverity.HIGH,
      metadata: { targetUserId, reason, impersonationSessionId: session.id },
      ipAddress: context.ip,
      userAgent: context.userAgent,
    });

    return { token, session };
  }

  async stopImpersonation(adminId: string, targetUserId: string, context: any) {
    await this.securityEventService.logEvent({
      userId: adminId,
      eventType: SecurityEventType.ADMIN_IMPERSONATION_ENDED as any,
      severity: SecuritySeverity.MEDIUM,
      metadata: { targetUserId },
      ipAddress: context.ip,
      userAgent: context.userAgent,
    });
  }
}
