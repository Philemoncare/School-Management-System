import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SecuritySeverity } from '@prisma/client';

@Injectable()
export class SecurityRiskService {
  constructor(private prisma: PrismaService) {}

  async evaluateLoginRisk(
    userId: string,
    context?: { ip?: string; userAgent?: string; deviceId?: string },
  ): Promise<{ score: number; severity: SecuritySeverity }> {
    let score = 0;
    const ctx = context || {};

    // 1. Check for new device
    if (ctx.deviceId) {
      const device = await this.prisma.userDevice.findUnique({
        where: { userId_deviceIdentifier: { userId, deviceIdentifier: ctx.deviceId } },
      });
      if (!device) score += 20; // New device
      else if (!device.isTrusted) score += 10;
    } else {
      score += 15; // Unidentified device
    }

    // 2. Check for unusual IP (simplified)
    const lastSession = await this.prisma.userSession.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (lastSession && ctx.ip && lastSession.ipAddress !== ctx.ip) {
      score += 10;
    }

    // 3. Check for recent failed attempts
    const failedAttempts = await this.prisma.securityEvent.count({
      where: {
        userId,
        eventType: 'LOGIN_FAILURE',
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // Last 15 mins
      },
    });
    score += (failedAttempts * 10);

    let severity: SecuritySeverity = SecuritySeverity.LOW;
    if (score >= 70) severity = SecuritySeverity.CRITICAL;
    else if (score >= 40) severity = SecuritySeverity.HIGH;
    else if (score >= 20) severity = SecuritySeverity.MEDIUM;

    return { score, severity };
  }

  async recordDevice(userId: string, identifier: string, info: { name?: string; type?: string; ip?: string }) {
    return this.prisma.userDevice.upsert({
      where: { userId_deviceIdentifier: { userId, deviceIdentifier: identifier } },
      update: { lastIp: info.ip, lastSeenAt: new Date() },
      create: {
        userId,
        deviceIdentifier: identifier,
        deviceName: info.name,
        deviceType: info.type,
        lastIp: info.ip,
      },
    });
  }
}
