import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionStatus, UserSession } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async createSession(params: {
    userId: string;
    schoolId?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    expiresInMinutes?: number;
  }): Promise<{ token: string; session: UserSession }> {
    const token = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(token);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (params.expiresInMinutes || 60));

    // Parse user agent for browser/os (simplified)
    const session = await this.prisma.userSession.create({
      data: {
        userId: params.userId,
        schoolId: params.schoolId,
        tokenHash,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        deviceId: params.deviceId,
        expiresAt,
        status: SessionStatus.ACTIVE,
      },
    });

    return { token, session };
  }

  async validateSession(token: string): Promise<UserSession> {
    const tokenHash = this.hashToken(token);
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.status !== SessionStatus.ACTIVE || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Update last seen
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });

    return session;
  }

  async revokeSession(sessionId: string, reason?: string) {
    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
  }

  async revokeUserSession(sessionId: string, userId: string, reason?: string) {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.revokeSession(sessionId, reason);
  }

  async revokeAllUserSessions(userId: string, exceptSessionId?: string) {
    return this.prisma.userSession.updateMany({
      where: {
        userId,
        id: exceptSessionId ? { not: exceptSessionId } : undefined,
        status: SessionStatus.ACTIVE,
      },
      data: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
        revokeReason: 'USER_LOGOUT_ALL',
      },
    });
  }

  async getUserSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, status: SessionStatus.ACTIVE },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
